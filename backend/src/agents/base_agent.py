from __future__ import annotations

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

from src.ai.llm_service import LLMService
from src.core.event_bus import EventBus
from src.memory.vector_store import VectorStore
from src.skills.executor import SkillExecutor

if TYPE_CHECKING:
    from src.providers.digitalocean.digitalocean_agent_router import DigitalOceanAgentRouter


class BaseAgent(ABC):
    agent_name = "base"

    def __init__(
        self,
        llm_service: LLMService,
        skill_executor: SkillExecutor,
        vector_store: VectorStore,
        event_bus: EventBus,
        digitalocean_router: DigitalOceanAgentRouter | None = None,
    ) -> None:
        self.llm = llm_service
        self.skills = skill_executor
        self.memory = vector_store
        self.event_bus = event_bus
        self.digitalocean_router = digitalocean_router

    async def _load_context(self, task_text: str, task_id: str) -> str:
        return await self.memory.retrieve_context(task_text, task_id=task_id, limit=5)

    async def _remember(self, task_id: str, content: str, memory_type: str) -> None:
        await self.memory.add_embedding(content=content, task_id=task_id, memory_type=memory_type)

    async def _emit(self, event_type: str, payload: dict) -> None:
        await self.event_bus.publish({"event": event_type, **payload})

    @abstractmethod
    async def execute(self, task: dict) -> dict:
        raise NotImplementedError
