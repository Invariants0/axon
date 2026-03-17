from __future__ import annotations

from datetime import datetime
from time import perf_counter

from sqlalchemy.ext.asyncio import AsyncSession

from src.agents.builder_agent import BuilderAgent
from src.agents.planning_agent import PlanningAgent
from src.agents.reasoning_agent import ReasoningAgent
from src.agents.research_agent import ResearchAgent
from src.ai.llm_service import LLMService
from src.config.config import get_settings
from src.core.event_bus import EventBus
from src.core.trace_context import TraceContext
from src.db.models import AgentExecution, MemoryRecord, Task
from src.memory.vector_store import VectorStore
from src.providers.digitalocean.digitalocean_agent_router import DigitalOceanAgentRouter
from src.skills.executor import SkillExecutor
from src.utils.logger import get_logger

logger = get_logger(__name__)


class AgentOrchestrator:
    def __init__(
        self,
        llm_service: LLMService,
        skill_executor: SkillExecutor,
        vector_store: VectorStore,
        event_bus: EventBus,
    ) -> None:
        self.event_bus = event_bus
        settings = get_settings()
        
        digitalocean_router = None
        if settings.axon_mode == "real":
            digitalocean_router = DigitalOceanAgentRouter()
        
        self.agents = {
            "planning": PlanningAgent(llm_service, skill_executor, vector_store, event_bus, digitalocean_router),
            "research": ResearchAgent(llm_service, skill_executor, vector_store, event_bus, digitalocean_router),
            "reasoning": ReasoningAgent(llm_service, skill_executor, vector_store, event_bus, digitalocean_router),
            "builder": BuilderAgent(llm_service, skill_executor, vector_store, event_bus, digitalocean_router),
        }

    async def _record_step(
        self,
        session: AsyncSession,
        task: Task,
        agent_name: str,
        input_payload: dict,
        output_payload: dict,
        status: str = "completed",
        start_time: datetime | None = None,
        end_time: datetime | None = None,
        error_message: str | None = None,
    ) -> None:
        """Record agent execution with timing info."""
        duration_ms = None
        if start_time and end_time:
            duration_ms = int((end_time - start_time).total_seconds() * 1000)
        
        execution = AgentExecution(
            task_id=task.id,
            agent_name=agent_name,
            status=status,
            input_payload=input_payload,
            output_payload=output_payload,
            start_time=start_time,
            end_time=end_time,
            duration_ms=duration_ms,
            error_message=error_message,
        )
        
        # Structured memory payload (Phase-4)
        memory_content = {
            "agent": agent_name,
            "type": "agent_output",
            "summary": str(output_payload)[:500],
            "task_id": task.id,
            "timestamp": datetime.utcnow().isoformat(),
            "status": status,
        }
        
        memory = MemoryRecord(
            task_id=task.id,
            memory_type="agent_output",
            content=str(output_payload),
            embedding_ref="",
            metadata_json=memory_content,
        )
        session.add(execution)
        session.add(memory)

    async def run_pipeline(self, task: Task, session: AsyncSession) -> dict:
        """Run all 4 agents in sequence with proper event emission and timing."""
        settings = get_settings()
        debug = settings.axon_debug_pipeline
        
        # Ensure trace context is set
        TraceContext.set_trace_id(task.trace_id)
        TraceContext.set_task_id(task.id)
        
        if debug:
            logger.info("[PIPELINE] Task created", task_id=task.id, title=task.title)
        
        # Emit pipeline started
        event = TraceContext.create_event("pipeline.started", data={"task_id": task.id})
        await self.event_bus.publish(event)
        
        logger.info("pipeline.started", task_id=task.id, title=task.title)

        # ===== PLANNING AGENT =====
        try:
            planning_input = {"id": task.id, "title": task.title, "description": task.description}
            planning_started_at = perf_counter()
            start_time = datetime.utcnow()
            
            if debug:
                logger.info("[PIPELINE] PlanningAgent started", task_id=task.id)
            
            # Emit agent.started event
            event = TraceContext.create_event(
                "agent.started",
                data={"agent_name": "planning", "task_id": task.id},
            )
            await self.event_bus.publish(event)
            
            planning_result = await self.agents["planning"].execute(planning_input)
            end_time = datetime.utcnow()
            planning_duration = round(perf_counter() - planning_started_at, 6)
            
            if debug:
                logger.info(
                    "[PIPELINE] PlanningAgent completed",
                    task_id=task.id,
                    duration=planning_duration,
                    output_size=len(str(planning_result)),
                )
            
            # Emit agent.completed event
            event = TraceContext.create_event(
                "agent.completed",
                data={
                    "agent_name": "planning",
                    "duration_ms": int(planning_duration * 1000),
                    "status": "success",
                },
            )
            await self.event_bus.publish(event)
            
            logger.info(
                "agent.completed",
                task_id=task.id,
                agent_name="planning",
                execution_time=planning_duration,
                duration_ms=int(planning_duration * 1000),
            )
            
            await self._record_step(
                session, task, "planning", planning_input, planning_result,
                status="completed", start_time=start_time, end_time=end_time
            )
        except Exception as e:  # noqa: BLE001
            logger.exception("agent.error", agent_name="planning", error=str(e))
            event = TraceContext.create_event(
                "agent.error",
                data={
                    "agent_name": "planning",
                    "error": str(e),
                    "error_type": type(e).__name__,
                },
            )
            await self.event_bus.publish(event)
            raise

        # ===== RESEARCH AGENT =====
        try:
            research_input = {
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "plan": planning_result.get("plan", {}),
            }
            research_started_at = perf_counter()
            start_time = datetime.utcnow()
            
            if debug:
                logger.info("[PIPELINE] ResearchAgent started", task_id=task.id)
            
            event = TraceContext.create_event(
                "agent.started",
                data={"agent_name": "research", "task_id": task.id},
            )
            await self.event_bus.publish(event)
            
            research_result = await self.agents["research"].execute(research_input)
            end_time = datetime.utcnow()
            research_duration = round(perf_counter() - research_started_at, 6)
            
            if debug:
                logger.info(
                    "[PIPELINE] ResearchAgent completed",
                    task_id=task.id,
                    duration=research_duration,
                    output_size=len(str(research_result)),
                )
            
            event = TraceContext.create_event(
                "agent.completed",
                data={
                    "agent_name": "research",
                    "duration_ms": int(research_duration * 1000),
                    "status": "success",
                },
            )
            await self.event_bus.publish(event)
            
            logger.info(
                "agent.completed",
                task_id=task.id,
                agent_name="research",
                execution_time=research_duration,
                duration_ms=int(research_duration * 1000),
            )
            
            await self._record_step(
                session, task, "research", research_input, research_result,
                status="completed", start_time=start_time, end_time=end_time
            )
        except Exception as e:  # noqa: BLE001
            logger.exception("agent.error", agent_name="research", error=str(e))
            event = TraceContext.create_event(
                "agent.error",
                data={
                    "agent_name": "research",
                    "error": str(e),
                    "error_type": type(e).__name__,
                },
            )
            await self.event_bus.publish(event)
            raise

        # ===== REASONING AGENT =====
        try:
            reasoning_input = {
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "plan": planning_result.get("plan", {}),
                "research": research_result,
            }
            reasoning_started_at = perf_counter()
            start_time = datetime.utcnow()
            
            if debug:
                logger.info("[PIPELINE] ReasoningAgent started", task_id=task.id)
            
            event = TraceContext.create_event(
                "agent.started",
                data={"agent_name": "reasoning", "task_id": task.id},
            )
            await self.event_bus.publish(event)
            
            reasoning_result = await self.agents["reasoning"].execute(reasoning_input)
            end_time = datetime.utcnow()
            reasoning_duration = round(perf_counter() - reasoning_started_at, 6)
            
            if debug:
                logger.info(
                    "[PIPELINE] ReasoningAgent completed",
                    task_id=task.id,
                    duration=reasoning_duration,
                    output_size=len(str(reasoning_result)),
                )
            
            event = TraceContext.create_event(
                "agent.completed",
                data={
                    "agent_name": "reasoning",
                    "duration_ms": int(reasoning_duration * 1000),
                    "status": "success",
                },
            )
            await self.event_bus.publish(event)
            
            logger.info(
                "agent.completed",
                task_id=task.id,
                agent_name="reasoning",
                execution_time=reasoning_duration,
                duration_ms=int(reasoning_duration * 1000),
            )
            
            await self._record_step(
                session, task, "reasoning", reasoning_input, reasoning_result,
                status="completed", start_time=start_time, end_time=end_time
            )
        except Exception as e:  # noqa: BLE001
            logger.exception("agent.error", agent_name="reasoning", error=str(e))
            event = TraceContext.create_event(
                "agent.error",
                data={
                    "agent_name": "reasoning",
                    "error": str(e),
                    "error_type": type(e).__name__,
                },
            )
            await self.event_bus.publish(event)
            raise

        # ===== BUILDER AGENT =====
        try:
            builder_input = {
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "plan": planning_result.get("plan", {}),
                "research": research_result,
                "reasoning": reasoning_result,
            }
            builder_started_at = perf_counter()
            start_time = datetime.utcnow()
            
            if debug:
                logger.info("[PIPELINE] BuilderAgent started", task_id=task.id)
            
            event = TraceContext.create_event(
                "agent.started",
                data={"agent_name": "builder", "task_id": task.id},
            )
            await self.event_bus.publish(event)
            
            builder_result = await self.agents["builder"].execute(builder_input)
            end_time = datetime.utcnow()
            builder_duration = round(perf_counter() - builder_started_at, 6)
            
            if debug:
                logger.info(
                    "[PIPELINE] BuilderAgent completed",
                    task_id=task.id,
                    duration=builder_duration,
                    output_size=len(str(builder_result)),
                )
            
            event = TraceContext.create_event(
                "agent.completed",
                data={
                    "agent_name": "builder",
                    "duration_ms": int(builder_duration * 1000),
                    "status": "success",
                },
            )
            await self.event_bus.publish(event)
            
            logger.info(
                "agent.completed",
                task_id=task.id,
                agent_name="builder",
                execution_time=builder_duration,
                duration_ms=int(builder_duration * 1000),
            )
            
            await self._record_step(
                session, task, "builder", builder_input, builder_result,
                status="completed", start_time=start_time, end_time=end_time
            )
        except Exception as e:  # noqa: BLE001
            logger.exception("agent.error", agent_name="builder", error=str(e))
            event = TraceContext.create_event(
                "agent.error",
                data={
                    "agent_name": "builder",
                    "error": str(e),
                    "error_type": type(e).__name__,
                },
            )
            await self.event_bus.publish(event)
            raise

        # ===== AGGREGATION & COMPLETION =====
        aggregated = {
            "planning": planning_result,
            "research": research_result,
            "reasoning": reasoning_result,
            "builder": builder_result,
        }
        
        if debug:
            logger.info("[PIPELINE] All agents completed", task_id=task.id)
        
        # Emit pipeline completed
        event = TraceContext.create_event(
            "pipeline.completed",
            data={
                "task_id": task.id,
                "status": "success",
                "result_size": len(str(aggregated)),
            },
        )
        await self.event_bus.publish(event)
        
        logger.info("pipeline.completed", task_id=task.id)
        return aggregated
