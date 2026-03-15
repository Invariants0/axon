from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable
from os import getenv
from time import perf_counter

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.agent_orchestrator import AgentOrchestrator
from src.core.event_bus import EventBus
from src.core.worker_pool import WorkerPool
from src.db.models import Task
from src.db.session import SessionLocal
from src.utils.logger import get_logger

logger = get_logger(__name__)


class TaskManager:
    def __init__(self, event_bus: EventBus, orchestrator: AgentOrchestrator) -> None:
        self.event_bus = event_bus
        self.orchestrator = orchestrator
        self._queue: asyncio.Queue[str] = asyncio.Queue()
        
        # PHASE-2: WorkerPool integration with backward compatibility
        # Default to 1 worker if AXON_WORKER_COUNT not set (identical to legacy behavior)
        worker_count = int(getenv("AXON_WORKER_COUNT", "1"))
        self._pool = WorkerPool(
            queue=self._queue,
            worker_task=self._process_task,
            worker_count=worker_count,
        )
        self._stopping = False

    async def start(self) -> None:
        if any(not w.done() for w in self._pool._workers):
            return
        self._stopping = False
        await self._pool.start()

    async def stop(self) -> None:
        self._stopping = True
        await self._pool.stop()

    async def create_task(self, session: AsyncSession, title: str, description: str) -> Task:
        started_at = perf_counter()
        task = Task(title=title, description=description, status="queued", result="")
        session.add(task)
        await session.flush()
        await self._queue.put(task.id)
        await self.event_bus.publish(
            {"event": "task.created", "task_id": task.id, "title": task.title, "status": task.status}
        )
        logger.info(
            "task.created",
            task_id=task.id,
            agent_name="task_manager",
            execution_time=round(perf_counter() - started_at, 6),
            title=title,
        )
        return task

    async def list_tasks(self, session: AsyncSession) -> list[Task]:
        result = await session.execute(select(Task).order_by(Task.created_at.desc()))
        return list(result.scalars().all())

    async def get_task(self, session: AsyncSession, task_id: str) -> Task | None:
        result = await session.execute(select(Task).where(Task.id == task_id))
        return result.scalar_one_or_none()

    async def _process_task(self, task_id: str) -> None:
        """Process a single task (called by WorkerPool)."""
        task_started_at = perf_counter()
        async with SessionLocal() as session:
            try:
                task = await self.get_task(session, task_id)
                if not task:
                    return
                task.status = "running"
                await session.flush()
                await self.event_bus.publish(
                    {"event": "task.progress", "task_id": task.id, "status": task.status}
                )
                logger.info(
                    "task.started",
                    task_id=task.id,
                    agent_name="task_manager",
                    execution_time=round(perf_counter() - task_started_at, 6),
                )

                result = await self.orchestrator.run_pipeline(task, session)
                task.status = "completed"
                task.result = str(result)
                await session.commit()
                await self.event_bus.publish(
                    {
                        "event": "task.progress",
                        "task_id": task.id,
                        "status": task.status,
                    }
                )
                logger.info(
                    "task.completed",
                    task_id=task.id,
                    agent_name="task_manager",
                    execution_time=round(perf_counter() - task_started_at, 6),
                )
            except Exception as exc:  # noqa: BLE001
                await session.rollback()
                failed = await self.get_task(session, task_id)
                if failed:
                    failed.status = "failed"
                    failed.result = str(exc)
                    await session.commit()
                await self.event_bus.publish(
                    {
                        "event": "task.error",
                        "task_id": task_id,
                        "error": str(exc),
                    }
                )
                logger.exception("task_failed", task_id=task_id, error=str(exc))

    # Legacy run() method kept for backward compatibility with tests
    async def run(self) -> None:
        """Legacy single-worker loop (for backward compatibility)."""
        while not self._stopping:
            await self._process_task_legacy()

    async def _process_task_legacy(self) -> None:
        """Legacy single-item processing (for backward compatibility)."""
        task_id = await self._queue.get()
        try:
            await self._process_task(task_id)
        finally:
            self._queue.task_done()

    def queue_size(self) -> int:
        return self._queue.qsize()

    def status(self) -> str:
        """Get task manager status (backward compatible)."""
        pool_status = self._pool.status()
        if pool_status["is_running"]:
            return "running"
        return "stopped"

    def pool_status(self) -> dict:
        """Get detailed worker pool status (PHASE-2)."""
        return self._pool.status()
