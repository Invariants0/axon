from __future__ import annotations

import re
from datetime import datetime, timezone
from importlib import invalidate_caches

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.ai.llm_service import LLMService
from src.core.event_bus import EventBus
from src.db.models import Skill, Task
from src.skills.registry import SkillRegistry
from src.utils.logger import get_logger

logger = get_logger(__name__)


class EvolutionEngine:
    def __init__(
        self,
        llm_service: LLMService,
        skill_registry: SkillRegistry,
        event_bus: EventBus,
    ) -> None:
        self.llm = llm_service
        self.skill_registry = skill_registry
        self.event_bus = event_bus
        self.last_run: datetime | None = None
        self.generated_count: int = 0

    def _sanitize_name(self, name: str) -> str:
        cleaned = re.sub(r"[^a-zA-Z0-9_]+", "_", name.strip().lower())
        return cleaned.strip("_") or "generated_skill"

    async def _failed_tasks_count(self, session: AsyncSession) -> int:
        count_query = select(func.count()).select_from(Task).where(Task.status == "failed")
        result = await session.execute(count_query)
        return int(result.scalar() or 0)

    async def evolve(self, session: AsyncSession) -> dict:
        failed_count = await self._failed_tasks_count(session)
        if failed_count == 0:
            return await self.get_status(session)

        skill_name = f"recovery_helper_{self.generated_count + 1}"
        prompt = (
            "Generate a concise skill purpose for helping recover failed software tasks. "
            "Return one sentence only."
        )
        description = await self.llm.complete(prompt)
        module_name = self._sanitize_name(skill_name)

        safe_description = description[:200].replace('"', "'").replace("\n", " ")
        code = (
            "SKILL = {\n"
            f"    \"name\": \"{module_name}\",\n"
            f"    \"description\": \"{safe_description}\",\n"
            "    \"parameters\": {\n"
            "        \"failure\": {\"type\": \"string\", \"required\": True}\n"
            "    },\n"
            "    \"version\": \"1.0.0\",\n"
            "}\n\n"
            "async def execute(payload: dict) -> dict:\n"
            "    failure = payload.get(\"failure\", \"\")\n"
            "    return {\n"
            "        \"action\": \"retry_with_smaller_scope\",\n"
            "        \"reason\": f\"Generated mitigation for: {failure}\",\n"
            "    }\n"
        )

        output_path = self.skill_registry.generated_skills_path() / f"{module_name}.py"
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(code, encoding="utf-8")

        invalidate_caches()
        self.skill_registry.discover_skills()
        definition = self.skill_registry.get(module_name)

        db_skill = Skill(
            name=definition.name,
            description=definition.description,
            source_code=definition.source,
            version=definition.version,
        )
        session.add(db_skill)
        await session.flush()

        self.generated_count += 1
        self.last_run = datetime.now(timezone.utc)
        await self.event_bus.publish(
            {
                "event": "evolution.generated",
                "skill": definition.name,
                "description": definition.description,
            }
        )
        logger.info("skill_generated", name=definition.name)
        return await self.get_status(session)

    async def get_status(self, session: AsyncSession) -> dict:
        failed_count = await self._failed_tasks_count(session)
        return {
            "status": "active",
            "generated_skills": self.generated_count,
            "failed_tasks": failed_count,
            "last_run": self.last_run.isoformat() if self.last_run else None,
        }
