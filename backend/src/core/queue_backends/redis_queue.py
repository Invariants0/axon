"""Redis-Backed Task Queue Implementation (Distributed)

Multi-process queue using Redis.
Enables distributed worker nodes.

Requires: redis, aioredis
Configuration: AXON_REDIS_URL, AXON_REDIS_QUEUE_NAME
"""

from __future__ import annotations

import json
import os
from typing import Any

from src.core.task_queue import Task, TaskQueue
from src.utils.logger import logger


class RedisTaskQueue(TaskQueue):
    """Redis-backed task queue for distributed execution"""

    def __init__(self) -> None:
        self.redis_url = os.getenv("AXON_REDIS_URL", "redis://localhost:6379")
        self.queue_name = os.getenv("AXON_REDIS_QUEUE_NAME", "axon:tasks")
        self._redis = None
        self._connected = False

    async def _get_client(self) -> Any:
        """Lazy load Redis client"""
        if self._redis is None:
            try:
                import aioredis

                self._redis = await aioredis.create_redis_pool(self.redis_url)
                self._connected = True
                logger.info(f"Connected to Redis: {self.redis_url}")
            except ImportError:
                logger.error("aioredis not installed. Install with: pip install aioredis")
                raise
            except Exception as e:
                logger.error(f"Failed to connect to Redis: {e}")
                self._connected = False
                raise
        return self._redis

    async def enqueue(self, task: Task) -> None:
        """Add task to Redis queue"""
        try:
            client = await self._get_client()
            payload = json.dumps(
                {
                    "task_id": task.task_id,
                    "payload": task.payload,
                    "priority": task.priority,
                    "retry_count": task.retry_count,
                }
            )
            await client.lpush(self.queue_name, payload)
            logger.debug(f"Task enqueued to Redis: {task.task_id}")
        except Exception as e:
            logger.error(f"Failed to enqueue task: {e}")
            raise

    async def dequeue(self, timeout: float = 1.0) -> Task | None:
        """Retrieve task from Redis queue with timeout"""
        try:
            client = await self._get_client()
            # Redis BRPOP blocks with timeout
            result = await client.brpop(self.queue_name, timeout=int(timeout))
            if result:
                queue_name, payload_bytes = result
                payload = json.loads(payload_bytes.decode())
                task = Task(
                    task_id=payload["task_id"],
                    payload=payload["payload"],
                    priority=payload.get("priority", 0),
                    retry_count=payload.get("retry_count", 0),
                )
                # Store in-flight key for acknowledgment
                await client.set(f"{self.queue_name}:in_flight:{task.task_id}", "1", expire=3600)
                logger.debug(f"Task dequeued from Redis: {task.task_id}")
                return task
            return None
        except Exception as e:
            logger.error(f"Failed to dequeue task: {e}")
            return None

    async def ack(self, task_id: str) -> None:
        """Mark task as successfully completed in Redis"""
        try:
            client = await self._get_client()
            await client.delete(f"{self.queue_name}:in_flight:{task_id}")
            await client.incr(f"{self.queue_name}:completed")
            logger.debug(f"Task acknowledged in Redis: {task_id}")
        except Exception as e:
            logger.error(f"Failed to acknowledge task: {e}")

    async def nack(self, task_id: str, retry: bool = False) -> None:
        """Mark task as failed in Redis"""
        try:
            client = await self._get_client()
            if retry:
                # Move back to queue for retry
                await client.rpush(
                    self.queue_name,
                    json.dumps({"task_id": task_id, "retry": True}),
                )
                logger.debug(f"Task requeued in Redis: {task_id}")
            else:
                await client.delete(f"{self.queue_name}:in_flight:{task_id}")
                await client.incr(f"{self.queue_name}:failed")
                logger.error(f"Task permanently failed in Redis: {task_id}")
        except Exception as e:
            logger.error(f"Failed to nack task: {e}")

    async def size(self) -> int:
        """Get Redis queue size"""
        try:
            client = await self._get_client()
            size = await client.llen(self.queue_name)
            return size or 0
        except Exception as e:
            logger.error(f"Failed to get queue size: {e}")
            return 0

    async def health_check(self) -> bool:
        """Check Redis connectivity"""
        try:
            client = await self._get_client()
            await client.ping()
            self._connected = True
            return True
        except Exception as e:
            logger.error(f"Redis health check failed: {e}")
            self._connected = False
            return False

    async def close(self) -> None:
        """Close Redis connection"""
        if self._redis:
            self._redis.close()
            await self._redis.wait_closed()
            self._connected = False
            logger.info("Redis task queue closed")
