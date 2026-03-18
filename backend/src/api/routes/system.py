from fastapi import APIRouter, Depends, Path
from sqlalchemy.ext.asyncio import AsyncSession

from src.ai.llm_service import LLMService
from src.api.controllers.system_controller import (
    get_event_stats as get_event_stats_controller,
    get_pipeline_graph as get_pipeline_controller,
    get_system_metrics as get_metrics_controller,
    get_system_status as get_status_controller,
    get_task_timeline as get_timeline_controller,
)
from src.config.dependencies import (
    get_app_settings,
    get_db_session,
    get_event_bus,
    get_llm_service,
    get_orchestrator,
    get_skill_registry,
    get_task_manager,
    get_vector_store,
    rate_limit_hook,
    require_api_key,
)
from src.schemas.system import SystemStatusResponse
from src.services.system_service import SystemService

router = APIRouter(dependencies=[Depends(require_api_key), Depends(rate_limit_hook)])


async def get_system_service(
    settings=Depends(get_app_settings),
    session: AsyncSession = Depends(get_db_session),
    task_manager=Depends(get_task_manager),
    vector_store=Depends(get_vector_store),
    skill_registry=Depends(get_skill_registry),
    orchestrator=Depends(get_orchestrator),
    event_bus=Depends(get_event_bus),
    llm_service: LLMService = Depends(get_llm_service),
) -> SystemService:
    """Dependency injection for SystemService"""
    return SystemService(
        settings=settings,
        session=session,
        task_manager=task_manager,
        vector_store=vector_store,
        skill_registry=skill_registry,
        orchestrator=orchestrator,
        event_bus=event_bus,
        llm_service=llm_service,
    )


@router.get("/", response_model=SystemStatusResponse)
async def get_system_status(
    system_service: SystemService = Depends(get_system_service),
) -> SystemStatusResponse:
    """Get overall system status and health checks"""
    status = await get_status_controller(system_service)
    return SystemStatusResponse(**status)


@router.get("/pipeline")
async def get_pipeline_graph(
    system_service: SystemService = Depends(get_system_service),
):
    """
    Get pipeline execution graph structure.

    Returns the DAG (directed acyclic graph) of the 4-stage agent pipeline.
    """
    return await get_pipeline_controller(system_service)


@router.get("/metrics")
async def get_system_metrics(
    system_service: SystemService = Depends(get_system_service),
):
    """
    Get system-wide metrics (Phase-4 enhanced).

    Returns current metrics including:
    - Tasks processed and failed
    - Active task count
    - Queue size
    - Worker count
    - LLM call count
    - Evolution trigger count
    - Circuit breaker state
    - System uptime
    - Event bus statistics
    """
    return await get_metrics_controller(system_service)


@router.get("/tasks/{task_id}/timeline")
async def get_task_timeline(
    task_id: str = Path(..., description="Task ID"),
    system_service: SystemService = Depends(get_system_service),
):
    """
    Get complete execution timeline for a task (Phase-4).

    Returns:
    - Task metadata
    - All agent executions with timing (start, end, duration)
    - Execution order and dependencies
    - Total pipeline duration
    """
    return await get_timeline_controller(system_service, task_id)


@router.get("/events/stats")
async def get_event_stats(
    system_service: SystemService = Depends(get_system_service),
):
    """
    Get event bus statistics (Phase-4).

    Returns:
    - Total events published
    - Event distribution by type
    - Subscriber count
    - Event bus status
    """
    return await get_event_stats_controller(system_service)


@router.get("/config")
async def get_config(
    system_service: SystemService = Depends(get_system_service),
):
    """
    Get active system configuration (Phase-4).

    Returns:
    - AXON_MODE (mock/gemini/gradient/real)
    - LLM provider info
    - Vector store type
    - Evolution status
    - Feature flags
    """
    return await system_service.get_active_config()


