from src.services.skill_service import SkillService


async def list_skills(skill_service: SkillService):
    return await skill_service.list_skills()


async def get_skill_code(name: str, skill_service: SkillService) -> dict:
    return await skill_service.get_skill_code(name)
