import asyncio
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.config import Settings
from src.core.agent_orchestrator import AgentOrchestrator
from src.core.event_bus import EventBus
from src.core.task_manager import TaskManager
from src.db.models import AgentExecution, Task
from src.memory.vector_store import VectorStore
from src.skills.registry import SkillRegistry


class SystemService:
    """Business logic for system status and metrics"""

    def __init__(
        self,
        settings: Settings,
        session: AsyncSession,
        task_manager: TaskManager,
        vector_store: VectorStore,
        skill_registry: SkillRegistry,
        orchestrator: AgentOrchestrator,
        event_bus: EventBus,
    ):
        self.settings = settings
        self.session = session
        self.task_manager = task_manager
        self.vector_store = vector_store
        self.skill_registry = skill_registry
        self.orchestrator = orchestrator
        self.event_bus = event_bus

    async def check_database(self) -> str:
        """Check database connectivity"""
        try:
            await self.session.execute(text("SELECT 1"))
            return "ok"
        except Exception:
            return "error"

    async def check_vector_store(self) -> str:
        """Check vector store connectivity"""
        try:
            await asyncio.to_thread(self.vector_store.collection.count)
            return "ok"
        except Exception:
            return "error"

    async def get_system_status(self) -> dict:
        """Get overall system status with health checks"""
        db_state = await self.check_database()
        vs_state = await self.check_vector_store()

        skills_loaded = len(self.skill_registry.all())
        agents_ready = bool(getattr(self.orchestrator, "agents", {}))
        event_bus_state = "running" if self.event_bus.is_running else "stopped"
        task_queue_state = "running" if self.task_manager.status() == "running" else "stopped"

        return {
            "status": "ready",
            "app": self.settings.app_name,
            "environment": self.settings.env,
            "database": db_state,
            "vector_store": vs_state,
            "skills_loaded": skills_loaded,
            "agents_ready": agents_ready,
            "event_bus": event_bus_state,
            "task_queue": task_queue_state,
        }

    def get_pipeline_graph(self) -> dict:
        """Get pipeline execution DAG"""
        try:
            pipeline_graph = getattr(self.orchestrator, "pipeline_graph", None)
            if pipeline_graph:
                return {
                    "nodes": ["planning", "research", "reasoning", "builder"],
                    "edges": [
                        ["planning", "research"],
                        ["research", "reasoning"],
                        ["reasoning", "builder"],
                    ],
                    "description": "Sequential 4-stage agent pipeline",
                }
            return {
                "nodes": ["planning", "research", "reasoning", "builder"],
                "edges": [
                    ["planning", "research"],
                    ["research", "reasoning"],
                    ["reasoning", "builder"],
                ],
                "description": "Sequential 4-stage agent pipeline",
            }
        except Exception as e:
            return {
                "error": str(e),
                "nodes": ["planning", "research", "reasoning", "builder"],
                "edges": [
                    ["planning", "research"],
                    ["research", "reasoning"],
                    ["reasoning", "builder"],
                ],
            }

    async def get_system_metrics(self) -> dict:
        """Get system-wide metrics"""
        try:
            # Collect metrics from task manager
            worker_pool = getattr(self.task_manager, "_pool", None)
            task_queue = getattr(self.task_manager, "_queue", None)

            return {
                "timestamp": asyncio.get_event_loop().time(),
                "version": "Phase-3",
                "workers": worker_pool.size if worker_pool else 0,
                "queued_tasks": task_queue.qsize() if task_queue else 0,
            }
        except Exception as e:
            return {
                "error": str(e),
                "timestamp": asyncio.get_event_loop().time(),
                "version": "Phase-3",
            }

    async def get_task_timeline(self, task_id: str) -> dict:
        """
        Get complete execution timeline for a task (Phase-4).
        
        Returns timing for each agent execution.
        """
        try:
            # Get task
            result = await self.session.execute(
                select(Task).where(Task.id == task_id)
            )
            task = result.scalar_one_or_none()
            
            if not task:
                return {"error": "Task not found", "task_id": task_id}
            
            # Get all executions for this task
            result = await self.session.execute(
                select(AgentExecution)
                .where(AgentExecution.task_id == task_id)
                .order_by(AgentExecution.created_at.asc())
            )
            executions = result.scalars().all()
            
            # Build timeline
            timeline_entries = []
            total_duration_ms = 0
            
            for execution in executions:
                entry = {
                    "agent_name": execution.agent_name,
                    "status": execution.status,
                    "start_time": execution.start_time.isoformat() if execution.start_time else None,
                    "end_time": execution.end_time.isoformat() if execution.end_time else None,
                    "duration_ms": execution.duration_ms,
                    "error": execution.error_message,
                }
                timeline_entries.append(entry)
                
                if execution.duration_ms:
                    total_duration_ms += execution.duration_ms
            
            return {
                "task_id": task_id,
                "trace_id": task.trace_id,
                "task_status": task.status,
                "created_at": task.created_at.isoformat() if task.created_at else None,
                "total_duration_ms": total_duration_ms,
                "agent_count": len(executions),
                "timeline": timeline_entries,
            }
        except Exception as e:
            return {
                "error": str(e),
                "task_id": task_id,
            }

    async def get_event_stats(self) -> dict:
        """
        Get event bus statistics (Phase-4).
        """
        try:
            subscriber_count = await self.event_bus.subscriber_count()
            event_count = self.event_bus.event_count
            
            return {
                "event_bus_status": "running" if self.event_bus.is_running else "stopped",
                "total_events_published": event_count,
                "subscriber_count": subscriber_count,
                "version": "Phase-4",
            }
        except Exception as e:
            return {
                "error": str(e),
                "version": "Phase-4",
            }

    async def get_active_config(self) -> dict:
        """
        Get active system configuration (Phase-4).
        """
        try:
            return {
                "app_name": self.settings.app_name,
                "environment": self.settings.env,
                "axon_mode": self.settings.axon_mode,
                "test_mode": self.settings.test_mode,
                "debug_mode": self.settings.axon_debug_pipeline,
                "vector_store_provider": self.settings.vector_db_provider,
                "llm_provider": self.settings.axon_mode,
                "evolution_enabled": True,
                "version": "Phase-4",
            }
        except Exception as e:
            return {
                "error": str(e),
                "version": "Phase-4",
            }
