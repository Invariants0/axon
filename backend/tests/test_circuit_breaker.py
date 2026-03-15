"""
Tests for Phase-3 CircuitBreaker refactoring.

Tests the new BreakerBackend abstraction and distributed state management.
"""

import pytest
from datetime import datetime, timedelta

from src.providers.circuit_breaker.breaker_backend import (
    BreakerState,
    BreakerSnapshot,
    InMemoryBreakerBackend,
)
from src.providers.digitalocean.circuit_breaker import (
    CircuitBreaker,
    CircuitBreakerOpen,
)


@pytest.fixture
def memory_backend():
    """Create a fresh in-memory backend for each test."""
    return InMemoryBreakerBackend()


@pytest.fixture
def circuit_breaker(memory_backend):
    """Create a circuit breaker with in-memory backend."""
    return CircuitBreaker(
        name="test_breaker",
        backend=memory_backend,
        failure_threshold=3,
        recovery_timeout=1.0,
        half_open_max_calls=2,
    )


class TestBackendState:
    """Test BreakerBackend state management."""

    @pytest.mark.asyncio
    async def test_initial_state_is_closed(self, memory_backend):
        """Initial state should be CLOSED."""
        state = await memory_backend.get_state("test")
        assert state == BreakerState.CLOSED

    @pytest.mark.asyncio
    async def test_set_state(self, memory_backend):
        """Should set and retrieve state."""
        await memory_backend.set_state("test", BreakerState.OPEN)
        state = await memory_backend.get_state("test")
        assert state == BreakerState.OPEN

    @pytest.mark.asyncio
    async def test_get_snapshot(self, memory_backend):
        """Should get snapshot with current metrics."""
        snapshot = await memory_backend.get_snapshot("test")
        assert snapshot.state == BreakerState.CLOSED
        assert snapshot.failure_count == 0
        assert snapshot.success_count == 0

    @pytest.mark.asyncio
    async def test_increment_failure(self, memory_backend):
        """Should increment failure count."""
        count1 = await memory_backend.increment_failure("test")
        count2 = await memory_backend.increment_failure("test")
        assert count1 == 1
        assert count2 == 2

    @pytest.mark.asyncio
    async def test_increment_success(self, memory_backend):
        """Should increment success count."""
        count1 = await memory_backend.increment_success("test")
        count2 = await memory_backend.increment_success("test")
        assert count1 == 1
        assert count2 == 2

    @pytest.mark.asyncio
    async def test_reset(self, memory_backend):
        """Should reset all metrics."""
        await memory_backend.increment_failure("test")
        await memory_backend.increment_failure("test")
        await memory_backend.set_state("test", BreakerState.OPEN)

        await memory_backend.reset("test")

        snapshot = await memory_backend.get_snapshot("test")
        assert snapshot.state == BreakerState.CLOSED
        assert snapshot.failure_count == 0
        assert snapshot.success_count == 0


class TestCircuitBreakerClosed:
    """Test CircuitBreaker in CLOSED state (normal operation)."""

    @pytest.mark.asyncio
    async def test_call_success(self, circuit_breaker):
        """Should return result on successful call."""

        async def success_func():
            return "success"

        result = await circuit_breaker.call(success_func)
        assert result == "success"

    @pytest.mark.asyncio
    async def test_call_failure_increments_count(self, circuit_breaker):
        """Should increment failure count on exception."""

        async def failing_func():
            raise ValueError("test error")

        with pytest.raises(ValueError):
            await circuit_breaker.call(failing_func)

        snapshot = await circuit_breaker._backend.get_snapshot(circuit_breaker.name)
        assert snapshot.failure_count == 1

    @pytest.mark.asyncio
    async def test_opens_after_threshold_failures(self, circuit_breaker):
        """Should transition to OPEN after threshold failures."""

        async def failing_func():
            raise ValueError("test error")

        # Fail 3 times (threshold=3)
        for _ in range(3):
            with pytest.raises(ValueError):
                await circuit_breaker.call(failing_func)

        # Circuit should be OPEN
        state = await circuit_breaker._backend.get_state(circuit_breaker.name)
        assert state == BreakerState.OPEN


class TestCircuitBreakerOpen:
    """Test CircuitBreaker in OPEN state (failure mode)."""

    @pytest.mark.asyncio
    async def test_rejects_calls_when_open(self, circuit_breaker):
        """Should reject calls with CircuitBreakerOpen."""
        # Transition to OPEN
        await circuit_breaker._backend.set_state(
            circuit_breaker.name, BreakerState.OPEN
        )

        async def my_func():
            pass

        with pytest.raises(CircuitBreakerOpen):
            await circuit_breaker.call(my_func)

    @pytest.mark.asyncio
    async def test_transitions_to_half_open_after_timeout(self, circuit_breaker):
        """Should transition to HALF_OPEN after recovery timeout."""
        # Transition to OPEN
        await circuit_breaker._backend.set_state(
            circuit_breaker.name, BreakerState.OPEN
        )

        # Get snapshot and simulate timeout
        snapshot = await circuit_breaker._backend.get_snapshot(
            circuit_breaker.name
        )
        # Manually adjust last_failure_time to simulate timeout
        # (In real scenario, time would pass naturally)

        # For this test, we'll manually transition since the timeout is 1 second
        import asyncio

        await asyncio.sleep(1.1)

        async def success_func():
            return "recovered"

        result = await circuit_breaker.call(success_func)
        assert result == "recovered"

        # Should be in HALF_OPEN now
        state = await circuit_breaker._backend.get_state(circuit_breaker.name)
        assert state == BreakerState.HALF_OPEN


class TestCircuitBreakerHalfOpen:
    """Test CircuitBreaker in HALF_OPEN state (recovery)."""

    @pytest.mark.asyncio
    async def test_limits_calls_in_half_open(self, circuit_breaker):
        """Should limit calls to half_open_max_calls."""
        # Transition to HALF_OPEN
        await circuit_breaker._backend.set_state(
            circuit_breaker.name, BreakerState.HALF_OPEN
        )

        async def success_func():
            return "ok"

        # Make max_calls successful calls
        for _ in range(circuit_breaker.half_open_max_calls):
            await circuit_breaker.call(success_func)

        # Next call should be rejected
        with pytest.raises(CircuitBreakerOpen):
            await circuit_breaker.call(success_func)

    @pytest.mark.asyncio
    async def test_closes_after_recovery(self, circuit_breaker):
        """Should close after enough successes in HALF_OPEN."""
        # Transition to HALF_OPEN
        await circuit_breaker._backend.set_state(
            circuit_breaker.name, BreakerState.HALF_OPEN
        )

        async def success_func():
            return "ok"

        # Make max_calls successful calls
        for _ in range(circuit_breaker.half_open_max_calls):
            await circuit_breaker.call(success_func)

        # Should be CLOSED now
        state = await circuit_breaker._backend.get_state(circuit_breaker.name)
        assert state == BreakerState.CLOSED


class TestCircuitBreakerInstance:
    """Test singleton pattern via instance() class method."""

    def test_instance_singleton_per_backend(self, memory_backend):
        """Should return same instance for same name+backend."""
        breaker1 = CircuitBreaker.instance(
            "test", backend=memory_backend
        )
        breaker2 = CircuitBreaker.instance(
            "test", backend=memory_backend
        )
        assert breaker1 is breaker2

    def test_instance_different_backends(self):
        """Should return different instances for different backends."""
        backend1 = InMemoryBreakerBackend()
        backend2 = InMemoryBreakerBackend()

        breaker1 = CircuitBreaker.instance("test", backend=backend1)
        breaker2 = CircuitBreaker.instance("test", backend=backend2)

        assert breaker1 is not breaker2
        assert breaker1._backend is backend1
        assert breaker2._backend is backend2

    def test_instance_different_names(self, memory_backend):
        """Should return different instances for different names."""
        breaker1 = CircuitBreaker.instance(
            "test1", backend=memory_backend
        )
        breaker2 = CircuitBreaker.instance(
            "test2", backend=memory_backend
        )
        assert breaker1 is not breaker2


class TestCircuitBreakerStatus:
    """Test status() method."""

    @pytest.mark.asyncio
    async def test_status_includes_all_fields(self, circuit_breaker):
        """Status should include all required fields."""
        status = await circuit_breaker.status()
        assert "name" in status
        assert "state" in status
        assert "failure_count" in status
        assert "success_count" in status
        assert "total_requests" in status
        assert "total_failures" in status
        assert "total_successes" in status
        assert "state_changes" in status


class TestCircuitBreakerReset:
    """Test reset() method."""

    @pytest.mark.asyncio
    async def test_reset_to_closed(self, circuit_breaker):
        """Reset should transition to CLOSED."""
        # Transition to OPEN
        await circuit_breaker._backend.set_state(
            circuit_breaker.name, BreakerState.OPEN
        )

        # Reset
        await circuit_breaker.reset()

        state = await circuit_breaker._backend.get_state(circuit_breaker.name)
        assert state == BreakerState.CLOSED


class TestMetrics:
    """Test local metrics tracking."""

    @pytest.mark.asyncio
    async def test_metrics_incremented(self, circuit_breaker):
        """Metrics should be incremented on calls."""

        async def success_func():
            return "ok"

        await circuit_breaker.call(success_func)

        assert circuit_breaker._metrics["total_requests"] == 1
        assert circuit_breaker._metrics["total_successes"] == 1
        assert circuit_breaker._metrics["total_failures"] == 0
