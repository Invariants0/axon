from sqlalchemy.ext.asyncio import AsyncSession

from src.core.evolution_engine import EvolutionEngine


class EvolutionService:
    def __init__(self, evolution_engine: EvolutionEngine, session: AsyncSession) -> None:
        self.engine = evolution_engine
        self.session = session

    async def trigger(self) -> dict:
        return await self.engine.evolve(self.session)

    async def get_status(self) -> dict:
        return await self.engine.get_status(self.session)
