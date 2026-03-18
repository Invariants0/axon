from fastapi import APIRouter, Depends

from src.api.controllers.skill_controller import get_skill_code, list_skills
from src.config.dependencies import get_skill_service, rate_limit_hook, require_api_key
from src.schemas.skill import SkillListResponse, SkillResponse
from src.services.skill_service import SkillService

router = APIRouter(dependencies=[Depends(require_api_key), Depends(rate_limit_hook)])


@router.get("/", response_model=SkillListResponse)
async def get_skills(skill_service: SkillService = Depends(get_skill_service)) -> SkillListResponse:
    skills = await list_skills(skill_service)
    return SkillListResponse(items=[SkillResponse.model_validate(skill) for skill in skills])


@router.get("/{name}/code")
async def get_skill_source(
    name: str,
    skill_service: SkillService = Depends(get_skill_service),
) -> dict:
    """Return source code for a specific skill from the registry."""
    return await get_skill_code(name, skill_service)
