from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import Skill
from src.skills.registry import SkillRegistry


class SkillService:
    def __init__(self, skill_registry: SkillRegistry, session: AsyncSession) -> None:
        self.registry = skill_registry
        self.session = session

    async def list_skills(self) -> list[dict]:
        runtime_skills = self.registry.all()
        result = await self.session.execute(select(Skill))
        persisted = {item.name: item for item in result.scalars().all()}

        output = []
        for skill in runtime_skills:
            db_row = persisted.get(skill.name)
            output.append(
                {
                    "id": db_row.id if db_row else None,
                    "name": skill.name,
                    "description": skill.description,
                    "version": skill.version,
                    "parameters": skill.parameters,
                    "created_at": db_row.created_at if db_row else None,
                    "updated_at": db_row.updated_at if db_row else None,
                }
            )
        return output
