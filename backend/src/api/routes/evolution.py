from fastapi import APIRouter

from api.controllers.evolution_controller import get_evolution_status

router = APIRouter()


@router.get("/")
async def get_evolution() -> dict:
    return await get_evolution_status()
