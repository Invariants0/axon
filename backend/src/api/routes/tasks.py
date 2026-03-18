from fastapi import APIRouter, Depends, Query

from src.api.controllers.task_controller import create_task, get_task, list_tasks
from src.config.dependencies import get_task_service, rate_limit_hook, require_api_key
from src.schemas.task import (
    ExecutionTimeline,
    StageTimestamp,
    TaskCreate,
    TaskListResponse,
    TaskResponse,
)
from src.services.task_service import TaskService

router = APIRouter(dependencies=[Depends(require_api_key), Depends(rate_limit_hook)])


@router.get("/", response_model=TaskListResponse)
async def get_tasks(
    chat_id: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=500),
    task_service: TaskService = Depends(get_task_service),
) -> TaskListResponse:
    tasks = await list_tasks(task_service, chat_id=chat_id)
    # Sort newest-first and apply limit
    sorted_tasks = sorted(tasks, key=lambda t: t.created_at, reverse=True)[:limit]
    return TaskListResponse(items=[TaskResponse.model_validate(task) for task in sorted_tasks])


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


# Phase-3: Execution Timeline Endpoint
@router.get("/{task_id}/timeline", response_model=ExecutionTimeline)
async def get_task_timeline(
    task_id: str, task_service: TaskService = Depends(get_task_service)
) -> ExecutionTimeline:
    """
    Get execution timeline for a task.
    
    Returns timing information for each pipeline stage:
    - planning: Task breakdown into steps
    - research: Information gathering
    - reasoning: Insight generation
    - builder: Implementation generation
    """
    try:
        task = await get_task(task_id, task_service)
        
        # Extract timing metadata if available
        # For now, return default timeline structure
        timeline = ExecutionTimeline(
            task_id=task_id,
            stages=[
                StageTimestamp(name="planning", duration_ms=0),
                StageTimestamp(name="research", duration_ms=0),
                StageTimestamp(name="reasoning", duration_ms=0),
                StageTimestamp(name="builder", duration_ms=0),
            ],
            total_duration_ms=0,
        )
        
        # If timing data exists in task metadata, populate it
        if hasattr(task, "execution_timeline"):
            timeline = ExecutionTimeline.model_validate(task.execution_timeline)
        
        return timeline
    except Exception as e:
        # Return empty timeline on error
        return ExecutionTimeline(
            task_id=task_id,
            stages=[
                StageTimestamp(name="planning", duration_ms=0),
                StageTimestamp(name="research", duration_ms=0),
                StageTimestamp(name="reasoning", duration_ms=0),
                StageTimestamp(name="builder", duration_ms=0),
            ],
            total_duration_ms=0,
        )

