from fastapi import HTTPException, status

from src.schemas.task import TaskCreate
from src.services.task_service import TaskService


async def create_task(payload: TaskCreate, task_service: TaskService):
    task = await task_service.create_task(payload)
    return task


async def list_tasks(task_service: TaskService, chat_id: str | None = None):
    if chat_id is None:
        return await task_service.list_tasks()
    return await task_service.list_tasks(chat_id=chat_id)


async def get_task(task_id: str, task_service: TaskService):
    task = await task_service.get_task(task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task
