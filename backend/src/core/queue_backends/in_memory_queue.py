"""In-Memory Task Queue Implementation (Default)

Single-process queue using asyncio primitives.
Maintains backward compatibility with Phase-2 WorkerPool.
"""

from __future__ import annotations

import asyncio
from typing import Any

from src.core.task_queue import Task, TaskQueue
from src.utils.logger import logger


class InMemoryTaskQueue(TaskQueue):
    """In-memory task queue for single-process execution"""

    def __init__(self) -> None:
        self._queue: asyncio.Queue = asyncio.Queue()
        self._in_flight: dict[str, Task] = {}
        self._completed: set[str] = set()
        self._healthy = True

    async def enqueue(self, task: Task) -> None:
        """Add task to queue"""
        await self._queue.put(task)
        logger.debug(f"Task enqueued: {task.task_id}")

    async def dequeue(self, timeout: float = 1.0) -> Task | None:
        """Retrieve task from queue with timeout"""
        try:
            task = await asyncio.wait_for(self._queue.get(), timeout=timeout)
            self._in_flight[task.task_id] = task
            logger.debug(f"Task dequeued: {task.task_id}")
            return task
        except asyncio.TimeoutError:
            return None

    async def ack(self, task_id: str) -> None:
        """Mark task as successfully completed"""
        if task_id in self._in_flight:
            del self._in_flight[task_id]
        self._completed.add(task_id)
        logger.debug(f"Task acknowledged: {task_id}")

    async def nack(self, task_id: str, retry: bool = False) -> None:
        """Mark task as failed"""
        if task_id in self._in_flight:
            task = self._in_flight[task_id]
            if retry and task.retry_count < 3:
                task.retry_count += 1
                await self.enqueue(task)
                logger.debug(f"Task requeued (retry {task.retry_count}): {task_id}")
            else:
                del self._in_flight[task_id]
                logger.error(f"Task permanently failed: {task_id}")

    async def size(self) -> int:
        """Get current queue size"""
        return self._queue.qsize()

    async def health_check(self) -> bool:
        """Queue is always healthy (in-memory, no external dependencies)"""
        return self._healthy

    async def close(self) -> None:
        """Cleanup queue"""
        self._queue = asyncio.Queue()
        self._in_flight.clear()
        self._completed.clear()
        self._healthy = False
        logger.info("In-memory task queue closed")
