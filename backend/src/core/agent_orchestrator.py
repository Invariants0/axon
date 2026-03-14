from __future__ import annotations

from time import perf_counter

from sqlalchemy.ext.asyncio import AsyncSession

from src.agents.builder_agent import BuilderAgent
from src.agents.planning_agent import PlanningAgent
from src.agents.reasoning_agent import ReasoningAgent
from src.agents.research_agent import ResearchAgent
from src.ai.llm_service import LLMService
from src.config.config import get_settings
from src.core.event_bus import EventBus
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
    ) -> None:
        execution = AgentExecution(
            task_id=task.id,
            agent_name=agent_name,
            status="completed",
            input_payload=input_payload,
            output_payload=output_payload,
        )
        memory = MemoryRecord(
            task_id=task.id,
            memory_type="agent_output",
            content=str(output_payload),
            embedding_ref="",
            metadata_json={"agent": agent_name},
        )
        session.add(execution)
        session.add(memory)

    async def run_pipeline(self, task: Task, session: AsyncSession) -> dict:
        await self.event_bus.publish(
            {"event": "task.progress", "task_id": task.id, "status": "orchestrating"}
        )
        logger.info("orchestrator_start", task_id=task.id, title=task.title)

        planning_input = {"id": task.id, "title": task.title, "description": task.description}
        planning_started_at = perf_counter()
        logger.info(
            "agent.planning.started",
            task_id=task.id,
            agent_name="planning",
            execution_time=0.0,
        )
        planning_result = await self.agents["planning"].execute(planning_input)
        logger.info(
            "agent.planning.completed",
            task_id=task.id,
            agent_name="planning",
            execution_time=round(perf_counter() - planning_started_at, 6),
        )
        await self._record_step(session, task, "planning", planning_input, planning_result)

        research_input = {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "plan": planning_result.get("plan", {}),
        }
        research_started_at = perf_counter()
        logger.info(
            "agent.research.started",
            task_id=task.id,
            agent_name="research",
            execution_time=0.0,
        )
        research_result = await self.agents["research"].execute(research_input)
        logger.info(
            "agent.research.completed",
            task_id=task.id,
            agent_name="research",
            execution_time=round(perf_counter() - research_started_at, 6),
        )
        await self._record_step(session, task, "research", research_input, research_result)

        reasoning_input = {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "plan": planning_result.get("plan", {}),
            "research": research_result,
        }
        reasoning_started_at = perf_counter()
        logger.info(
            "agent.reasoning.started",
            task_id=task.id,
            agent_name="reasoning",
            execution_time=0.0,
        )
        reasoning_result = await self.agents["reasoning"].execute(reasoning_input)
        logger.info(
            "agent.reasoning.completed",
            task_id=task.id,
            agent_name="reasoning",
            execution_time=round(perf_counter() - reasoning_started_at, 6),
        )
        await self._record_step(session, task, "reasoning", reasoning_input, reasoning_result)

        builder_input = {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "plan": planning_result.get("plan", {}),
            "research": research_result,
            "reasoning": reasoning_result,
        }
        builder_started_at = perf_counter()
        logger.info(
            "agent.builder.started",
            task_id=task.id,
            agent_name="builder",
            execution_time=0.0,
        )
        builder_result = await self.agents["builder"].execute(builder_input)
        logger.info(
            "agent.builder.completed",
            task_id=task.id,
            agent_name="builder",
            execution_time=round(perf_counter() - builder_started_at, 6),
        )
        await self._record_step(session, task, "builder", builder_input, builder_result)

        aggregated = {
            "planning": planning_result,
            "research": research_result,
            "reasoning": reasoning_result,
            "builder": builder_result,
        }
        await self.event_bus.publish(
            {
                "event": "task.result",
                "task_id": task.id,
                "status": "completed",
                "result": aggregated,
            }
        )
        logger.info("orchestrator_complete", task_id=task.id)
        return aggregated
