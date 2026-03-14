from src.services.skill_service import SkillService


async def list_skills(skill_service: SkillService):
    return await skill_service.list_skills()
