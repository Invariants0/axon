"""
Worker Pool Architecture for concurrent task processing.

Provides configurable pooling of background workers to process tasks
in parallel while maintaining backward compatibility with single-worker mode.

Features:
  - Configurable worker count (defaults to 1 for backward compatibility)
  - Safe queue consumption with error handling
  - Graceful shutdown with task draining
  - Performance metrics and status reporting
  - Extensible for future scaling needs
"""

from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable
from time import perf_counter
from typing import TYPE_CHECKING

from src.utils.logger import get_logger

if TYPE_CHECKING:
    from asyncio import Queue, Task

logger = get_logger(__name__)

# Worker task signature: receives item and processes it
WorkerTask = Callable[[str], Awaitable[None]]


class WorkerPool:
    """
    Async worker pool for concurrent task processing.
    
    In single-worker mode (worker_count=1), behaves identically to legacy
    processing. In multi-worker mode, distributes work across concurrent handlers.
    
    All workers pull from the same async.Queue, maintaining FIFO ordering
    guarantees for backward compatibility across all modes.
    """

    def __init__(
        self,
        queue: Queue[str],
        worker_task: WorkerTask,
        worker_count: int = 1,
    ) -> None:
        """
        Initialize worker pool.

        Args:
            queue: asyncio.Queue feeding task IDs to workers
            worker_task: Async callable(task_id) that processes one item
            worker_count: Number of concurrent workers (default: 1 for backward compat)
        """
        self._queue = queue
        self._worker_task = worker_task
        self._worker_count = max(1, int(worker_count))
        self._workers: list[Task[None]] = []
        self._stopping = False
        self._stats = {
            "processed": 0,
            "failed": 0,
            "started_at": None,
        }

    async def start(self) -> None:
        """Launch all worker tasks."""
        if self._workers and any(not w.done() for w in self._workers):
            logger.warning(
                "worker_pool_already_running",
                active_workers=len([w for w in self._workers if not w.done()]),
            )
            return

        self._stopping = False
        self._stats["started_at"] = perf_counter()
        self._workers = []

        for worker_id in range(self._worker_count):
            worker = asyncio.create_task(
                self._worker_loop(worker_id),
                name=f"axon-worker-{worker_id}",
            )
            self._workers.append(worker)

        logger.info(
            "worker_pool_started",
            worker_count=self._worker_count,
        )

    async def stop(self) -> None:
        """Gracefully shutdown all workers, finishing current items."""
        self._stopping = True
        logger.info("worker_pool_stopping", active_workers=len(self._workers))

        # Give workers time to finish current items
        await asyncio.gather(*(w for w in self._workers if not w.done()), return_exceptions=True)

        # Cancel any remaining tasks
        for worker in self._workers:
            if not worker.done():
                worker.cancel()
                try:
                    await worker
                except asyncio.CancelledError:
                    pass

        logger.info(
            "worker_pool_stopped",
            processed=self._stats["processed"],
            failed=self._stats["failed"],
        )

    async def _worker_loop(self, worker_id: int) -> None:
        """Main worker loop that processes items from queue."""
        logger.info("worker_started", worker_id=worker_id)

        while not self._stopping:
            try:
                # Get next item with timeout to check stopping flag
                try:
                    item = self._queue.get_nowait()
                except asyncio.QueueEmpty:
                    # Small sleep to prevent busy-waiting
                    await asyncio.sleep(0.01)
                    continue

                # Process the item
                task_id = item
                process_start = perf_counter()

                try:
                    await self._worker_task(task_id)
                    self._stats["processed"] += 1
                    process_time = round(perf_counter() - process_start, 3)
                    
                    logger.info(
                        "worker_task_completed",
                        worker_id=worker_id,
                        task_id=task_id,
                        duration_seconds=process_time,
                    )

                except Exception as exc:
                    self._stats["failed"] += 1
                    process_time = round(perf_counter() - process_start, 3)
                    
                    logger.error(
                        "worker_task_failed",
                        worker_id=worker_id,
                        task_id=task_id,
                        error=str(exc),
                        duration_seconds=process_time,
                    )

                finally:
                    self._queue.task_done()

            except asyncio.CancelledError:
                logger.info("worker_cancelled", worker_id=worker_id)
                break
            except Exception as exc:
                logger.error(
                    "worker_unexpected_error",
                    worker_id=worker_id,
                    error=str(exc),
                )
                await asyncio.sleep(1)  # Back off on critical error

        logger.info("worker_stopped", worker_id=worker_id)

    async def drain(self) -> None:
        """Wait for queue to be fully processed."""
        await self._queue.join()
        logger.info("worker_pool_drained")

    def status(self) -> dict:
        """Get current pool status and statistics."""
        active = sum(1 for w in self._workers if not w.done())
        uptime = None
        if self._stats["started_at"]:
            uptime = round(perf_counter() - self._stats["started_at"], 2)

        return {
            "worker_count": self._worker_count,
            "active_workers": active,
            "queue_size": self._queue.qsize(),
            "processed": self._stats["processed"],
            "failed": self._stats["failed"],
            "uptime_seconds": uptime,
            "is_running": any(not w.done() for w in self._workers),
        }
