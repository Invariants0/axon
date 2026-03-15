from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str = ""


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    description: str
    status: str
    result: str
    created_at: datetime
    updated_at: datetime


class TaskListResponse(BaseModel):
    items: list[TaskResponse]


class TaskExecutionResult(BaseModel):
    task_id: str
    status: str
    result: dict


# Phase-3: Execution Timeline Support
class StageTimestamp(BaseModel):
    """Timing for a pipeline stage"""

    name: str
    start_time: datetime | None = None
    end_time: datetime | None = None
    duration_ms: int = 0


class ExecutionTimeline(BaseModel):
    """Complete execution timeline for a task"""

    task_id: str
    stages: list[StageTimestamp] = Field(default_factory=list)
    total_duration_ms: int = 0
    start_time: datetime | None = None
    end_time: datetime | None = None
