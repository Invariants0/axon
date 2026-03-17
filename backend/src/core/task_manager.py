from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable
from os import getenv
from time import perf_counter

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from src.core.agent_orchestrator import AgentOrchestrator
from src.core.event_bus import EventBus
from src.core.trace_context import TraceContext
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

    async def create_task(
        self,
        session: AsyncSession,
        title: str,
        description: str,
        chat_id: str | None = None,
    ) -> Task:
        started_at = perf_counter()

        # Generate trace_id for this task
        trace_id = TraceContext.generate_trace_id()
        TraceContext.set_trace_id(trace_id)

        task = Task(
            chat_id=chat_id,
            title=title,
            description=description,
            status="queued",
            result="",
            trace_id=trace_id,
        )
        session.add(task)
        try:
            await session.flush()
        except IntegrityError as exc:
            # Likely caused by an invalid foreign key value (e.g., unknown chat_id)
            logger.warning(
                "task.create_failed_invalid_chat",
                chat_id=chat_id,
                error=str(exc),
            )
            # Let the caller translate this into an appropriate HTTP error (e.g., 400/404)
            raise ValueError(f"Invalid chat_id: {chat_id}") from exc
        await self._queue.put(task.id)

        # Emit event using new event structure
        event = TraceContext.create_event(
            "task.created",
            data={
                "task_id": task.id,
                "chat_id": task.chat_id,
                "title": task.title,
                "status": task.status,
            },
            trace_id=trace_id,
            task_id=task.id,
        )
        await self.event_bus.publish(event)
        logger.info(
            "task.created",
            task_id=task.id,
            trace_id=trace_id,
            agent_name="task_manager",
            execution_time=round(perf_counter() - started_at, 6),
            title=title,
            trace_id=trace_id,
        )
        return task

    async def list_tasks(self, session: AsyncSession, chat_id: str | None = None) -> list[Task]:
        stmt = select(Task)
        if chat_id:
            stmt = stmt.where(Task.chat_id == chat_id)
        result = await session.execute(stmt.order_by(Task.created_at.desc()))
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
                
                # Set trace context from task
                TraceContext.set_trace_id(task.trace_id)
                TraceContext.set_task_id(task.id)
                
                task.status = "running"
                await session.flush()
                
                # Emit task.started event
                event = TraceContext.create_event(
                    "task.started",
                    data={"task_id": task.id, "status": task.status},
                )
                await self.event_bus.publish(event)
                
                logger.info(
                    "task.started",
                    task_id=task.id,
                    trace_id=task.trace_id,
                    agent_name="task_manager",
                    execution_time=round(perf_counter() - task_started_at, 6),
                )

                result = await self.orchestrator.run_pipeline(task, session)
                task.status = "completed"
                task.result = str(result)
                await session.commit()
                
                # Emit task.completed event
                event = TraceContext.create_event(
                    "task.completed",
                    data={
                        "task_id": task.id,
                        "status": task.status,
                        "result_size": len(str(result)),
                    },
                )
                await self.event_bus.publish(event)
                
                logger.info(
                    "task.completed",
                    task_id=task.id,
                    trace_id=task.trace_id,
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
                
                # Emit task.failed event
                event = TraceContext.create_event(
                    "task.failed",
                    data={
                        "task_id": task_id,
                        "error": str(exc),
                        "error_type": type(exc).__name__,
                    },
                    task_id=task_id,
                )
                await self.event_bus.publish(event)
                
                logger.exception(
                    "task.failed",
                    task_id=task_id,
                    error=str(exc),
                )

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
