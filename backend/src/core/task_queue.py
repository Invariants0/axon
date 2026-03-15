"""
Task Queue Abstraction for Distributed Task Processing

Supports multiple backends:
- In-memory (default, single-process)
- Redis (distributed, multi-process)

Phase-3: Distributed Task Queue foundation
"""

from __future__ import annotations

import asyncio
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

from src.utils.logger import logger


@dataclass
class Task:
    """Represents a queued task"""

    task_id: str
    payload: dict[str, Any]
    priority: int = 0
    retry_count: int = 0


class TaskQueue(ABC):
    """Abstract base for task queue backends"""

    @abstractmethod
    async def enqueue(self, task: Task) -> None:
        """Add task to queue"""
        pass

    @abstractmethod
    async def dequeue(self, timeout: float = 1.0) -> Task | None:
        """Retrieve task from queue (blocking with timeout)"""
        pass

    @abstractmethod
    async def ack(self, task_id: str) -> None:
        """Acknowledge task completion"""
        pass

    @abstractmethod
    async def nack(self, task_id: str, retry: bool = False) -> None:
        """Negative acknowledge (failed task)"""
        pass

    @abstractmethod
    async def size(self) -> int:
        """Get queue size"""
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        """Verify queue connectivity and health"""
        pass

    @abstractmethod
    async def close(self) -> None:
        """Close queue connections"""
        pass


def get_queue_backend(backend_type: str) -> TaskQueue:
    """Factory for queue backends based on configuration"""

    if backend_type == "redis":
        try:
            from src.core.queue_backends.redis_queue import RedisTaskQueue

            return RedisTaskQueue()
        except ImportError as e:
            logger.warning(f"Redis queue import failed: {e}, falling back to in-memory")
            from src.core.queue_backends.in_memory_queue import InMemoryTaskQueue

            return InMemoryTaskQueue()
    else:
        from src.core.queue_backends.in_memory_queue import InMemoryTaskQueue

        return InMemoryTaskQueue()
