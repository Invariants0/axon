"""
Distributed Circuit Breaker Backend Abstraction

Supports multiple backends for shared breaker state:
- In-memory (default, single-process)
- Redis (distributed, multi-process)

Phase-3: Distributed Circuit Breaker foundation
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

from src.utils.logger import logger


class BreakerState(Enum):
    """Circuit breaker states"""

    CLOSED = "closed"  # Normal operation
    OPEN = "open"  # Failing, rejecting requests
    HALF_OPEN = "half_open"  # Testing recovery


@dataclass
class BreakerSnapshot:
    """Snapshot of breaker state"""

    name: str
    state: BreakerState
    failure_count: int = 0
    success_count: int = 0
    last_failure_time: datetime | None = None
    last_state_change: datetime | None = None


class BreakerBackend(ABC):
    """Abstract base for circuit breaker state backends"""

    @abstractmethod
    async def get_state(self, name: str) -> BreakerState:
        """Get current breaker state"""
        pass

    @abstractmethod
    async def set_state(self, name: str, state: BreakerState) -> None:
        """Set breaker state"""
        pass

    @abstractmethod
    async def increment_failure(self, name: str) -> int:
        """Increment failure count, return new count"""
        pass

    @abstractmethod
    async def increment_success(self, name: str) -> int:
        """Increment success count, return new count"""
        pass

    @abstractmethod
    async def reset(self, name: str) -> None:
        """Reset breaker state"""
        pass

    @abstractmethod
    async def get_snapshot(self, name: str) -> BreakerSnapshot:
        """Get breaker snapshot with all state"""
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        """Verify backend connectivity and health"""
        pass

    @abstractmethod
    async def close(self) -> None:
        """Close backend connections"""
        pass


def get_breaker_backend(backend_type: str) -> BreakerBackend:
    """Factory for breaker backends based on configuration"""

    if backend_type == "redis":
        try:
            from src.providers.circuit_breaker.redis_backend import RedisBreaker

            return RedisBreaker()
        except ImportError as e:
            logger.warning(f"Redis breaker import failed: {e}, falling back to memory")
            from src.providers.circuit_breaker.memory_backend import MemoryBreaker

            return MemoryBreaker()
    else:
        from src.providers.circuit_breaker.memory_backend import MemoryBreaker

        return MemoryBreaker()


try:
    from src.providers.circuit_breaker.memory_backend import (
        MemoryBreaker as InMemoryBreakerBackend,
    )
except Exception:
    class InMemoryBreakerBackend(BreakerBackend):
        """Compatibility alias for MemoryBreaker.

        Lazily delegates construction in case import order is still resolving.
        """

        def __new__(cls, *args, **kwargs):
            from src.providers.circuit_breaker.memory_backend import MemoryBreaker

            return MemoryBreaker(*args, **kwargs)

        async def get_state(self, name: str) -> BreakerState:
            raise NotImplementedError()

        async def set_state(self, name: str, state: BreakerState) -> None:
            raise NotImplementedError()

        async def increment_failure(self, name: str) -> int:
            raise NotImplementedError()

        async def increment_success(self, name: str) -> int:
            raise NotImplementedError()

        async def reset(self, name: str) -> None:
            raise NotImplementedError()

        async def get_snapshot(self, name: str) -> BreakerSnapshot:
            raise NotImplementedError()

        async def health_check(self) -> bool:
            raise NotImplementedError()

        async def close(self) -> None:
            raise NotImplementedError()
