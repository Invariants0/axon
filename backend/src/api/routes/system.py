import asyncio

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.config import Settings
from src.config.dependencies import (
    get_app_settings,
    get_db_session,
    get_event_bus,
    get_orchestrator,
    get_skill_registry,
    get_task_manager,
    get_vector_store,
    rate_limit_hook,
    require_api_key,
)
from src.core.agent_orchestrator import AgentOrchestrator
from src.core.event_bus import EventBus
from src.core.task_manager import TaskManager
from src.memory.vector_store import VectorStore
from src.schemas.system import SystemStatusResponse
from src.skills.registry import SkillRegistry

router = APIRouter(dependencies=[Depends(require_api_key), Depends(rate_limit_hook)])


@router.get("/", response_model=SystemStatusResponse)
async def get_system_status(
    settings: Settings = Depends(get_app_settings),
    session: AsyncSession = Depends(get_db_session),
    vector_store: VectorStore = Depends(get_vector_store),
    skill_registry: SkillRegistry = Depends(get_skill_registry),
    orchestrator: AgentOrchestrator = Depends(get_orchestrator),
    task_manager: TaskManager = Depends(get_task_manager),
    event_bus: EventBus = Depends(get_event_bus),
) -> SystemStatusResponse:
    database_state = "ok"
    try:
        await session.execute(text("SELECT 1"))
    except Exception:
        database_state = "error"

    vector_store_state = "ok"
    try:
        await asyncio.to_thread(vector_store.collection.count)
    except Exception:
        vector_store_state = "error"

    skills_loaded = len(skill_registry.all())
    agents_ready = bool(getattr(orchestrator, "agents", {}))
    event_bus_state = "running" if event_bus.is_running else "stopped"
    task_queue = "running" if task_manager.status() == "running" else "stopped"
    return SystemStatusResponse(
        status="ready",
        app=settings.app_name,
        environment=settings.env,
        database=database_state,
        vector_store=vector_store_state,
        skills_loaded=skills_loaded,
        agents_ready=agents_ready,
        event_bus=event_bus_state,
        task_queue=task_queue,
    )
