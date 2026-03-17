from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.api.routes import tasks
from src.config.dependencies import get_task_service, rate_limit_hook, require_api_key
from src.schemas.task import TaskCreate


class FakeTaskService:
    async def create_task(self, payload: TaskCreate, chat_id=None, *args, **kwargs):
        return {
            "id": "task-1",
            "title": payload.title,
            "description": payload.description,
            "status": "queued",
            "result": "",
            "created_at": "2026-03-12T00:00:00Z",
            "updated_at": "2026-03-12T00:00:00Z",
        }

    async def list_tasks(self, chat_id=None, *args, **kwargs):
        return [
            {
                "id": "task-1",
                "title": "T1",
                "description": "D1",
                "status": "completed",
                "result": "ok",
                "created_at": "2026-03-12T00:00:00Z",
                "updated_at": "2026-03-12T00:00:00Z",
            }
        ]

    async def get_task(self, task_id: str):
        return {
            "id": task_id,
            "title": "T1",
            "description": "D1",
            "status": "completed",
            "result": "ok",
            "created_at": "2026-03-12T00:00:00Z",
            "updated_at": "2026-03-12T00:00:00Z",
        }


def create_app() -> FastAPI:
    app = FastAPI()
    app.include_router(tasks.router, prefix="/tasks")

    async def _fake_task_service():
        yield FakeTaskService()

    async def _noop():
        return None

    app.dependency_overrides[get_task_service] = _fake_task_service
    app.dependency_overrides[require_api_key] = _noop
    app.dependency_overrides[rate_limit_hook] = _noop
    return app


def test_tasks_post_and_get():
    client = TestClient(create_app())

    post_response = client.post("/tasks/", json={"title": "Do it", "description": "Now"})
    assert post_response.status_code == 201
    assert post_response.json()["id"] == "task-1"

    get_response = client.get("/tasks/")
    assert get_response.status_code == 200
    assert len(get_response.json()["items"]) == 1
