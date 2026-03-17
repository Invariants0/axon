import pytest

from src.schemas.task import TaskCreate
from src.services.task_service import TaskService


class FakeTaskManager:
    async def create_task(self, session, title: str, description: str, chat_id=None, *args, **kwargs):
        return {"id": "1", "title": title, "description": description, "status": "queued", "result": ""}

    async def list_tasks(self, session, chat_id=None, *args, **kwargs):
        return [{"id": "1", "title": "a", "description": "b", "status": "completed", "result": "ok"}]

    async def get_task(self, session, task_id: str):
        return {"id": task_id, "title": "a", "description": "b", "status": "completed", "result": "ok"}


@pytest.mark.asyncio
async def test_task_service_create_task():
    service = TaskService(task_manager=FakeTaskManager(), session=object())
    task = await service.create_task(TaskCreate(title="Build endpoint", description="Implement route"))
    assert task["title"] == "Build endpoint"
    assert task["status"] == "queued"
