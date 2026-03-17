"""In-Memory Circuit Breaker Backend (Default)

Single-process breaker state using dictionaries.
Maintains backward compatibility with Phase-2 CircuitBreaker.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from src.providers.circuit_breaker.breaker_backend import (
    BreakerBackend,
    BreakerSnapshot,
    BreakerState,
)
from src.utils.logger import logger


@dataclass
class _BreakerData:
    """Internal breaker state"""

    state: BreakerState = BreakerState.CLOSED
    failure_count: int = 0
    success_count: int = 0
    last_failure_time: datetime | None = None
    last_state_change: datetime | None = None


from dataclasses import dataclass


class MemoryBreaker(BreakerBackend):
    """In-memory circuit breaker backend for single-process execution"""

    def __init__(self) -> None:
        self._breakers: dict[str, _BreakerData] = {}
        self._healthy = True

    def _ensure_breaker(self, name: str) -> None:
        """Create breaker if it doesn't exist"""
        if name not in self._breakers:
            self._breakers[name] = _BreakerData(
                state=BreakerState.CLOSED,
                last_state_change=datetime.utcnow(),
            )

    async def get_state(self, name: str) -> BreakerState:
        """Get breaker state"""
        self._ensure_breaker(name)
        return self._breakers[name].state

    async def set_state(self, name: str, state: BreakerState) -> None:
        """Set breaker state"""
        self._ensure_breaker(name)
        old_state = self._breakers[name].state
        self._breakers[name].state = state
        self._breakers[name].last_state_change = datetime.utcnow()
        if old_state != state:
            logger.debug(f"Breaker state changed: {name} {old_state.value} → {state.value}")

    async def increment_failure(self, name: str) -> int:
        """Increment failure count"""
        self._ensure_breaker(name)
        self._breakers[name].failure_count += 1
        self._breakers[name].last_failure_time = datetime.utcnow()
        self._breakers[name].success_count = 0
        return self._breakers[name].failure_count

    async def increment_success(self, name: str) -> int:
        """Increment success count"""
        self._ensure_breaker(name)
        self._breakers[name].success_count += 1
        # Reset failure count on success
        if self._breakers[name].state == BreakerState.HALF_OPEN:
            self._breakers[name].failure_count = 0
        return self._breakers[name].success_count

    async def reset(self, name: str) -> None:
        """Reset breaker to closed state"""
        self._ensure_breaker(name)
        self._breakers[name].state = BreakerState.CLOSED
        self._breakers[name].failure_count = 0
        self._breakers[name].success_count = 0
        self._breakers[name].last_state_change = datetime.utcnow()
        logger.debug(f"Breaker reset: {name}")

    async def get_snapshot(self, name: str) -> BreakerSnapshot:
        """Get breaker snapshot"""
        self._ensure_breaker(name)
        data = self._breakers[name]
        return BreakerSnapshot(
            name=name,
            state=data.state,
            failure_count=data.failure_count,
            success_count=data.success_count,
            last_failure_time=data.last_failure_time,
            last_state_change=data.last_state_change,
        )

    async def health_check(self) -> bool:
        """Memory backend is always healthy"""
        return self._healthy

    async def close(self) -> None:
        """Cleanup"""
        self._breakers.clear()
        self._healthy = False
        logger.info("Memory circuit breaker backend closed")
