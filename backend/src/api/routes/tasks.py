from fastapi import APIRouter, Depends

from src.api.controllers.task_controller import create_task, get_task, list_tasks
from src.config.dependencies import get_task_service, rate_limit_hook, require_api_key
from src.schemas.task import TaskCreate, TaskListResponse, TaskResponse
from src.services.task_service import TaskService

router = APIRouter(dependencies=[Depends(require_api_key), Depends(rate_limit_hook)])


@router.get("/", response_model=TaskListResponse)
async def get_tasks(task_service: TaskService = Depends(get_task_service)) -> TaskListResponse:
    tasks = await list_tasks(task_service)
    return TaskListResponse(items=[TaskResponse.model_validate(task) for task in tasks])


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task_by_id(task_id: str, task_service: TaskService = Depends(get_task_service)) -> TaskResponse:
    task = await get_task(task_id, task_service)
    return TaskResponse.model_validate(task)


@router.post("/", response_model=TaskResponse, status_code=201)
async def post_task(
    payload: TaskCreate,
    task_service: TaskService = Depends(get_task_service),
) -> TaskResponse:
    task = await create_task(payload, task_service)
    return TaskResponse.model_validate(task)
