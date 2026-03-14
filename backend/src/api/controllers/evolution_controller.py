from src.services.evolution_service import EvolutionService


async def get_evolution_status(evolution_service: EvolutionService):
    return await evolution_service.get_status()


async def trigger_evolution(evolution_service: EvolutionService):
    return await evolution_service.trigger()
