from sqlalchemy.ext.asyncio import AsyncSession

from src.core.task_manager import TaskManager
from src.schemas.task import TaskCreate


class TaskService:
    def __init__(self, task_manager: TaskManager, session: AsyncSession) -> None:
        self.task_manager = task_manager
        self.session = session

    async def create_task(self, payload: TaskCreate):
        return await self.task_manager.create_task(
            self.session,
            title=payload.title,
            description=payload.description,
        )

    async def list_tasks(self):
        return await self.task_manager.list_tasks(self.session)

    async def get_task(self, task_id: str):
        return await self.task_manager.get_task(self.session, task_id)
