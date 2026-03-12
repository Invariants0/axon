from fastapi import APIRouter

from api.controllers.skill_controller import list_skills

router = APIRouter()


@router.get("/")
async def get_skills() -> dict:
    return await list_skills()
