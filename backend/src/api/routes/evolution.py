from fastapi import APIRouter, Depends

from src.api.controllers.evolution_controller import get_evolution_status, trigger_evolution
from src.config.dependencies import get_evolution_service, rate_limit_hook, require_api_key
from src.schemas.evolution import EvolutionStatus
from src.services.evolution_service import EvolutionService

router = APIRouter(dependencies=[Depends(require_api_key), Depends(rate_limit_hook)])


@router.get("/", response_model=EvolutionStatus)
async def get_evolution(
    evolution_service: EvolutionService = Depends(get_evolution_service),
) -> EvolutionStatus:
    status = await get_evolution_status(evolution_service)
    return EvolutionStatus.model_validate(status)


@router.post("/run", response_model=EvolutionStatus)
async def run_evolution(
    evolution_service: EvolutionService = Depends(get_evolution_service),
) -> EvolutionStatus:
    status = await trigger_evolution(evolution_service)
    return EvolutionStatus.model_validate(status)
