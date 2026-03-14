from collections.abc import AsyncGenerator
from time import monotonic

from fastapi import Depends, Header, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.ai.llm_service import LLMService
from src.config.config import Settings, get_settings
from src.core.agent_orchestrator import AgentOrchestrator
from src.core.evolution_engine import EvolutionEngine
from src.core.event_bus import EventBus
from src.core.task_manager import TaskManager
from src.db.session import get_db_session
from src.memory.vector_store import VectorStore
from src.services.evolution_service import EvolutionService
from src.services.skill_service import SkillService
from src.services.task_service import TaskService
from src.skills.executor import SkillExecutor
from src.skills.registry import SkillRegistry

_event_bus = EventBus()
_skill_registry = SkillRegistry()
_skill_executor = SkillExecutor(_skill_registry)
_vector_store = VectorStore()
_llm_service = LLMService()
_orchestrator = AgentOrchestrator(
    llm_service=_llm_service,
    skill_executor=_skill_executor,
    vector_store=_vector_store,
    event_bus=_event_bus,
)
_task_manager = TaskManager(event_bus=_event_bus, orchestrator=_orchestrator)
_evolution_engine = EvolutionEngine(
    llm_service=_llm_service,
    skill_registry=_skill_registry,
    event_bus=_event_bus,
)
_rate_state: dict[str, tuple[int, float]] = {}


def get_app_settings() -> Settings:
    return get_settings()


def get_event_bus() -> EventBus:
    return _event_bus


def get_skill_registry() -> SkillRegistry:
    return _skill_registry


def get_llm_service() -> LLMService:
    return _llm_service


def get_vector_store() -> VectorStore:
    return _vector_store


def get_task_manager() -> TaskManager:
    return _task_manager


def get_orchestrator() -> AgentOrchestrator:
    return _orchestrator


def get_evolution_engine() -> EvolutionEngine:
    return _evolution_engine


async def get_task_service(
    session: AsyncSession = Depends(get_db_session),
) -> AsyncGenerator[TaskService, None]:
    yield TaskService(task_manager=_task_manager, session=session)


async def get_skill_service(
    session: AsyncSession = Depends(get_db_session),
) -> AsyncGenerator[SkillService, None]:
    yield SkillService(skill_registry=_skill_registry, session=session)


async def get_evolution_service(
    session: AsyncSession = Depends(get_db_session),
) -> AsyncGenerator[EvolutionService, None]:
    yield EvolutionService(evolution_engine=_evolution_engine, session=session)


async def require_api_key(
    x_api_key: str = Header(default=""),
    app_settings: Settings = Depends(get_app_settings),
) -> None:
    if not app_settings.api_key:
        return
    if x_api_key != app_settings.api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
        )


async def rate_limit_hook(
    request: Request,
    app_settings: Settings = Depends(get_app_settings),
) -> None:
    limit = app_settings.request_rate_limit_per_minute
    if limit <= 0:
        return
    key = request.client.host if request.client else "unknown"
    now = monotonic()
    count, window_start = _rate_state.get(key, (0, now))
    if now - window_start > 60:
        _rate_state[key] = (1, now)
        return
    if count >= limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded",
        )
    _rate_state[key] = (count + 1, window_start)
