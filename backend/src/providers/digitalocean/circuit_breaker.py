"""
Circuit Breaker Pattern for external agent calls.

Prevents cascading failures when ADK agents are unavailable by implementing
a state machine that rejects requests after a threshold of consecutive failures.

Phase-3 Integration: Now uses BreakerBackend abstraction for:
  - In-memory state (single-process, default)
  - Redis state (distributed, multi-process)

States:
  - CLOSED: Normal operation, requests pass through
  - OPEN: Too many failures, requests fail fast
  - HALF_OPEN: Attempting recovery with limited requests

Features:
  - Configurable failure threshold and recovery timeout
  - Automatic state transitions with reset capability
  - Request counting and failure tracking
  - Detailed metrics and logging
  - Thread-safe for concurrent async calls
  - Distributed via pluggable BreakerBackend
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from src.config.config import get_settings
from src.providers.circuit_breaker.breaker_backend import (
    BreakerBackend,
    BreakerState,
    get_breaker_backend,
)
from src.utils.logger import get_logger

logger = get_logger(__name__)

# Backward compatibility: export old enum name
CircuitState = BreakerState

# Global default backend instance (lazy-loaded)
_default_backend: Optional[BreakerBackend] = None


def _get_default_backend() -> BreakerBackend:
    """Lazy-load default backend from settings."""
    global _default_backend
    if _default_backend is None:
        settings = get_settings()
        _default_backend = get_breaker_backend(settings.axon_breaker_backend)
    return _default_backend


class CircuitBreaker:
    """
    Async circuit breaker for protecting external agent calls.

    When an external service (ADK agent) experiences failures, this breaker
    will temporarily reject requests to avoid further cascading failures,
    then gradually recover by testing with limited traffic.

    Phase-3: State is stored in pluggable BreakerBackend (in-memory or Redis).
    """

    # Singleton tracking for instance() method (per name + backend)
    _instances: dict[tuple[str, int], CircuitBreaker] = {}

    def __init__(
        self,
        name: str = "default",
        backend: Optional[BreakerBackend] = None,
        failure_threshold: int = 5,
        recovery_timeout: float = 60.0,
        half_open_max_calls: int = 3,
    ) -> None:
        """
        Initialize circuit breaker.

        Args:
            name: Circuit breaker identifier for logging
            backend: Optional BreakerBackend (uses default from settings if None)
            failure_threshold: Consecutive failures before opening (default: 5)
            recovery_timeout: Seconds before attempting recovery (default: 60)
            half_open_max_calls: Requests allowed in half-open state (default: 3)
        """
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.half_open_max_calls = half_open_max_calls

        # Phase-3: Use provided backend or get default from configuration
        if backend is None:
            backend = _get_default_backend()
        self._backend = backend

        # Local metrics for API/monitoring (complementary to backend state)
        self._metrics = {
            "total_requests": 0,
            "total_failures": 0,
            "total_successes": 0,
            "state_changes": 0,
        }

    async def call(self, func, *args, **kwargs) -> Any:
        """
        Execute function through circuit breaker protection.

        Phase-3: State is managed by BreakerBackend (may be distributed).

        Args:
            func: Async callable to execute
            *args, **kwargs: Arguments to pass to func

        Returns:
            Result from func

        Raises:
            CircuitBreakerOpen: If breaker is in OPEN state
            Exception: Any exception raised by func when breaker is CLOSED
        """
        self._metrics["total_requests"] += 1

        # Get current state from backend
        state = await self._backend.get_state(self.name)

        # If open, check if recovery is ready
        if state == BreakerState.OPEN:
            snapshot = await self._backend.get_snapshot(self.name)
            if self._is_recovery_ready(snapshot):
                await self._backend.set_state(self.name, BreakerState.HALF_OPEN)
                logger.info(
                    "circuit_breaker_state_change",
                    breaker_name=self.name,
                    from_state="open",
                    to_state="half_open",
                )
                state = BreakerState.HALF_OPEN
            else:
                raise CircuitBreakerOpen(
                    f"Circuit breaker '{self.name}' is open. "
                    f"Recovery in {self.recovery_timeout}s."
                )

        # In half-open, check if limit reached
        if state == BreakerState.HALF_OPEN:
            snapshot = await self._backend.get_snapshot(self.name)
            if snapshot.success_count >= self.half_open_max_calls:
                raise CircuitBreakerOpen(
                    f"Circuit breaker '{self.name}' half-open limit reached. "
                    f"Close breaker by completing recovery phase."
                )

        # Execute the function
        try:
            result = await func(*args, **kwargs)

            self._metrics["total_successes"] += 1
            success_count = await self._backend.increment_success(self.name)

            # If in half-open and enough successes, close the breaker
            if state == BreakerState.HALF_OPEN:
                if success_count >= self.half_open_max_calls:
                    await self._backend.set_state(self.name, BreakerState.CLOSED)
                    self._metrics["state_changes"] += 1
                    logger.info(
                        "circuit_breaker_state_change",
                        breaker_name=self.name,
                        from_state="half_open",
                        to_state="closed",
                    )

            return result

        except Exception as exc:
            self._metrics["total_failures"] += 1
            failure_count = await self._backend.increment_failure(self.name)

            logger.warning(
                "circuit_breaker_failure",
                breaker_name=self.name,
                failure_count=failure_count,
                error=str(exc),
                state=state.value,
            )

            # Transition to OPEN if threshold exceeded
            if (
                state == BreakerState.CLOSED
                and failure_count >= self.failure_threshold
            ):
                await self._backend.set_state(self.name, BreakerState.OPEN)
                self._metrics["state_changes"] += 1
                logger.info(
                    "circuit_breaker_state_change",
                    breaker_name=self.name,
                    from_state="closed",
                    to_state="open",
                )

            raise

    def _is_recovery_ready(self, snapshot) -> bool:
        """
        Check if recovery timeout has elapsed.

        Args:
            snapshot: BreakerSnapshot from backend

        Returns:
            True if recovery timeout has passed, False otherwise
        """
        if snapshot.last_failure_time is None:
            return True
        elapsed = (datetime.utcnow() - snapshot.last_failure_time).total_seconds()
        return elapsed >= self.recovery_timeout

    async def reset(self) -> None:
        """Manually reset circuit breaker to CLOSED state."""
        snapshot = await self._backend.get_snapshot(self.name)
        old_state = snapshot.state

        # Reset backend state
        await self._backend.reset(self.name)

        if old_state != BreakerState.CLOSED:
            logger.info(
                "circuit_breaker_reset",
                breaker_name=self.name,
                from_state=old_state.value,
            )

    async def status(self) -> dict:
        """
        Get current breaker status.

        Returns:
            Dictionary with current state and metrics

        Raises:
            Exception: If backend snapshot retrieval fails
        """
        snapshot = await self._backend.get_snapshot(self.name)

        return {
            "name": self.name,
            "state": snapshot.state.value,
            "failure_count": snapshot.failure_count,
            "success_count": snapshot.success_count,
            "total_requests": self._metrics["total_requests"],
            "total_failures": self._metrics["total_failures"],
            "total_successes": self._metrics["total_successes"],
            "state_changes": self._metrics["state_changes"],
        }

    @classmethod
    def instance(
        cls,
        name: str,
        backend: Optional[BreakerBackend] = None,
        failure_threshold: int = 5,
        recovery_timeout: float = 60.0,
        half_open_max_calls: int = 3,
    ) -> "CircuitBreaker":
        """
        Get or create a circuit breaker instance.

        This method provides singleton-like behavior per breaker name when
        using the same backend instance. Useful for reusing breakers across
        the application.

        Args:
            name: Unique name for this circuit breaker
            backend: Optional BreakerBackend instance (uses default if None)
            failure_threshold: Failures before opening
            recovery_timeout: Seconds before attempting recovery
            half_open_max_calls: Max calls during recovery phase

        Returns:
            CircuitBreaker instance

        Example:
            # Will create breaker first time, return same instance on subsequent calls
            breaker = CircuitBreaker.instance("api_calls")
            await breaker.call(my_async_func)
        """
        if backend is None:
            backend = _get_default_backend()

        breaker_key = (name, id(backend))

        if breaker_key not in cls._instances:
            cls._instances[breaker_key] = cls(
                name=name,
                backend=backend,
                failure_threshold=failure_threshold,
                recovery_timeout=recovery_timeout,
                half_open_max_calls=half_open_max_calls,
            )

        return cls._instances[breaker_key]


class CircuitBreakerOpen(Exception):
    """Raised when circuit breaker is open and request is rejected."""

    pass
