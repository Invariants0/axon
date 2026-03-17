"""Redis-Backed Circuit Breaker Backend (Distributed)

Multi-process breaker state using Redis.
Enables shared breaker state across worker nodes.

Requires: redis, aioredis
Configuration: AXON_REDIS_URL
"""

from __future__ import annotations

import json
import os
from datetime import datetime
from typing import Any

from src.providers.circuit_breaker.breaker_backend import (
    BreakerBackend,
    BreakerSnapshot,
    BreakerState,
)
from src.utils.logger import logger


class RedisBreaker(BreakerBackend):
    """Redis-backed circuit breaker backend for distributed execution"""

    def __init__(self) -> None:
        self.redis_url = os.getenv("AXON_REDIS_URL", "redis://localhost:6379")
        self.prefix = "axon:breaker"
        self._redis = None
        self._connected = False

    async def _get_client(self) -> Any:
        """Lazy load Redis client"""
        if self._redis is None:
            try:
                import aioredis

                self._redis = await aioredis.create_redis_pool(self.redis_url)
                self._connected = True
                logger.info(f"Connected to Redis for circuit breaker: {self.redis_url}")
            except ImportError:
                logger.error("aioredis not installed. Install with: pip install aioredis")
                raise
            except Exception as e:
                logger.error(f"Failed to connect to Redis: {e}")
                self._connected = False
                raise
        return self._redis

    async def get_state(self, name: str) -> BreakerState:
        """Get breaker state from Redis"""
        try:
            client = await self._get_client()
            state_str = await client.get(f"{self.prefix}:{name}:state")
            if state_str:
                return BreakerState(state_str.decode())
            return BreakerState.CLOSED
        except Exception as e:
            logger.error(f"Failed to get breaker state: {e}")
            return BreakerState.CLOSED

    async def set_state(self, name: str, state: BreakerState) -> None:
        """Set breaker state in Redis"""
        try:
            client = await self._get_client()
            await client.set(f"{self.prefix}:{name}:state", state.value)
            await client.set(
                f"{self.prefix}:{name}:state_change",
                datetime.utcnow().isoformat(),
            )
            if state == BreakerState.OPEN:
                await client.set(
                    f"{self.prefix}:{name}:last_failure",
                    datetime.utcnow().isoformat(),
                )
            logger.debug(f"Breaker state set in Redis: {name} = {state.value}")
        except Exception as e:
            logger.error(f"Failed to set breaker state: {e}")

    async def increment_failure(self, name: str) -> int:
        """Increment failure count in Redis"""
        try:
            client = await self._get_client()
            count = await client.incr(f"{self.prefix}:{name}:failures")
            await client.set(
                f"{self.prefix}:{name}:last_failure",
                datetime.utcnow().isoformat(),
            )
            await client.set(f"{self.prefix}:{name}:successes", 0)
            return int(count)
        except Exception as e:
            logger.error(f"Failed to increment failure: {e}")
            return 0

    async def increment_success(self, name: str) -> int:
        """Increment success count in Redis"""
        try:
            client = await self._get_client()
            count = await client.incr(f"{self.prefix}:{name}:successes")
            return int(count)
        except Exception as e:
            logger.error(f"Failed to increment success: {e}")
            return 0

    async def reset(self, name: str) -> None:
        """Reset breaker in Redis"""
        try:
            client = await self._get_client()
            await client.delete(f"{self.prefix}:{name}:state")
            await client.delete(f"{self.prefix}:{name}:failures")
            await client.delete(f"{self.prefix}:{name}:successes")
            await client.delete(f"{self.prefix}:{name}:last_failure")
            logger.debug(f"Breaker reset in Redis: {name}")
        except Exception as e:
            logger.error(f"Failed to reset breaker: {e}")

    async def get_snapshot(self, name: str) -> BreakerSnapshot:
        """Get breaker snapshot from Redis"""
        try:
            client = await self._get_client()
            state = await self.get_state(name)
            failures = await client.get(f"{self.prefix}:{name}:failures")
            successes = await client.get(f"{self.prefix}:{name}:successes")
            last_failure = await client.get(f"{self.prefix}:{name}:last_failure")
            state_change = await client.get(f"{self.prefix}:{name}:state_change")

            return BreakerSnapshot(
                name=name,
                state=state,
                failure_count=int(failures) if failures else 0,
                success_count=int(successes) if successes else 0,
                last_failure_time=(
                    datetime.fromisoformat(last_failure.decode())
                    if last_failure
                    else None
                ),
                last_state_change=(
                    datetime.fromisoformat(state_change.decode())
                    if state_change
                    else None
                ),
            )
        except Exception as e:
            logger.error(f"Failed to get breaker snapshot: {e}")
            return BreakerSnapshot(
                name=name,
                state=BreakerState.CLOSED,
            )

    async def health_check(self) -> bool:
        """Check Redis connectivity"""
        try:
            client = await self._get_client()
            await client.ping()
            self._connected = True
            return True
        except Exception as e:
            logger.error(f"Redis breaker health check failed: {e}")
            self._connected = False
            return False

    async def close(self) -> None:
        """Close Redis connection"""
        if self._redis:
            self._redis.close()
            await self._redis.wait_closed()
            self._connected = False
            logger.info("Redis circuit breaker backend closed")
