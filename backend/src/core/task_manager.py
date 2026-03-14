from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable
from time import perf_counter

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.agent_orchestrator import AgentOrchestrator
from src.core.event_bus import EventBus
from src.db.models import Task
from src.db.session import SessionLocal
from src.utils.logger import get_logger

logger = get_logger(__name__)


class TaskManager:
    def __init__(self, event_bus: EventBus, orchestrator: AgentOrchestrator) -> None:
        self.event_bus = event_bus
        self.orchestrator = orchestrator
        self._queue: asyncio.Queue[str] = asyncio.Queue()
        self._worker: asyncio.Task | None = None
        self._stopping = False

    async def start(self) -> None:
        if self._worker and not self._worker.done():
            return
        self._stopping = False
        self._worker = asyncio.create_task(self.run(), name="axon-task-worker")

    async def stop(self) -> None:
        self._stopping = True
        if self._worker:
            self._worker.cancel()
            try:
                await self._worker
            except asyncio.CancelledError:
                pass

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

    async def run(self) -> None:
        while not self._stopping:
            task_id = await self._queue.get()
            task_started_at = perf_counter()
            async with SessionLocal() as session:
                try:
                    task = await self.get_task(session, task_id)
                    if not task:
                        self._queue.task_done()
                        continue
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
                finally:
                    self._queue.task_done()

    def queue_size(self) -> int:
        return self._queue.qsize()

    def status(self) -> str:
        if self._worker and not self._worker.done() and not self._stopping:
            return "running"
        return "stopped"
