import asyncio
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from src.ai.llm_service import LLMService
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
        llm_service: LLMService | None = None,
    ):
        self.settings = settings
        self.session = session
        self.task_manager = task_manager
        self.vector_store = vector_store
        self.skill_registry = skill_registry
        self.orchestrator = orchestrator
        self.event_bus = event_bus
        self.llm_service = llm_service

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
            # Prefer a provider-agnostic health/statistics method if available,
            # and fall back to backend-specific attributes only when present.
            check_callable = None

            # Common pattern: a stats or health method on the vector_store itself.
            if hasattr(self.vector_store, "get_collection_stats"):
                check_callable = getattr(self.vector_store, "get_collection_stats")
            # Some implementations may expose a direct `count` method.
            elif hasattr(self.vector_store, "count"):
                check_callable = getattr(self.vector_store, "count")
            # Fallback to the original pattern, but guard attribute access.
            elif hasattr(self.vector_store, "collection") and hasattr(
                self.vector_store.collection, "count"
            ):
                check_callable = self.vector_store.collection.count

            # If we found a suitable callable, run it in a thread to avoid blocking.
            if check_callable is not None:
                await asyncio.to_thread(check_callable)

            return "ok"
        except Exception:
            return "error"

    async def check_gradient_llm(self) -> dict:
        """Check Gradient LLM health (Phase-5)"""
        if self.settings.axon_mode != "gradient":
            return {"status": "not_configured", "mode": self.settings.axon_mode}
        
        if not self.settings.gradient_api_key:
            return {"status": "misconfigured", "error": "GRADIENT_API_KEY not set"}
        
        try:
            if self.llm_service:
                health = await self.llm_service.gradient.health()
                return {
                    "status": "ok" if health.get("configured") == "yes" else "error",
                    "provider": "gradient",
                    "model": self.settings.gradient_model,
                    "endpoint": self.settings.gradient_base_url,
                }
            return {"status": "error", "error": "LLMService not available"}
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)[:200],
                "provider": "gradient",
            }

    async def check_adk_agents(self) -> dict:
        """Check ADK agents reachability (Phase-5)"""
        if self.settings.axon_mode != "real":
            return {"status": "not_configured", "mode": self.settings.axon_mode}
        
        if not self.settings.digitalocean_api_token:
            return {"status": "misconfigured", "error": "DIGITALOCEAN_API_TOKEN not set"}
        
        agents_status = {}
        
        if hasattr(self.orchestrator, "agents") and self.orchestrator.agents:
            for agent_name, agent in self.orchestrator.agents.items():
                if agent.digitalocean_router:
                    try:
                        health_results = await agent.digitalocean_router.health_check_all()
                        agents_status[agent_name] = health_results.get(agent_name, {})
                    except Exception as e:
                        agents_status[agent_name] = {"status": "error", "error": str(e)[:100]}
                else:
                    agents_status[agent_name] = {"status": "not_configured"}
        
        return {
            "status": "ok" if all(a.get("status") == "ok" for a in agents_status.values()) else "partial",
            "agents": agents_status,
            "digitalocean_api_token_configured": bool(self.settings.digitalocean_api_token),
        }

    async def get_system_status(self) -> dict:
        """Get overall system status with health checks (Phase-5 enhanced)"""
        db_state = await self.check_database()
        vs_state = await self.check_vector_store()
        gradient_state = await self.check_gradient_llm()
        adk_state = await self.check_adk_agents()

        skills_loaded = len(self.skill_registry.all())
        agents_ready = bool(getattr(self.orchestrator, "agents", {}))
        event_bus_state = "running" if self.event_bus.is_running else "stopped"
        task_queue_state = "running" if self.task_manager.status() == "running" else "stopped"

        return {
            "status": "ready",
            "app": self.settings.app_name,
            "environment": self.settings.env,
            "axon_mode": self.settings.axon_mode,
            "database": db_state,
            "vector_store": vs_state,
            "skills_loaded": skills_loaded,
            "agents_ready": agents_ready,
            "event_bus": event_bus_state,
            "task_queue": task_queue_state,
            "gradient_llm": gradient_state,
            "adk_agents": adk_state,
            "version": "Phase-5",
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

            workers = 0
            if worker_pool:
                try:
                    status = worker_pool.status()
                    if isinstance(status, dict):
                        workers = status.get("worker_count", 0)
                    else:
                        workers = getattr(status, "worker_count", 0)
                except Exception:
                    workers = 0

            return {
                "timestamp": asyncio.get_event_loop().time(),
                "version": "Phase-3",
                "workers": workers,
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
