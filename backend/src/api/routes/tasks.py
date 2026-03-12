from fastapi import APIRouter

from api.controllers.task_controller import create_task

router = APIRouter()


@router.get("/")
async def get_tasks() -> dict:
    return {"message": "tasks route placeholder", "items": []}


@router.post("/")
async def post_task(payload: dict) -> dict:
    return await create_task(payload)
