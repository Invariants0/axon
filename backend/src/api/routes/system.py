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
from src.core.metrics import MetricsCollector
from src.core.task_manager import TaskManager
from src.memory.vector_store import VectorStore
from src.schemas.system import SystemStatusResponse
from src.skills.registry import SkillRegistry

router = APIRouter(dependencies=[Depends(require_api_key), Depends(rate_limit_hook)])

# Phase-3: Metrics collector instance
_metrics_collector = MetricsCollector()


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


# Phase-3: Pipeline Graph Endpoint
@router.get("/pipeline")
async def get_pipeline_graph(
    orchestrator: AgentOrchestrator = Depends(get_orchestrator),
):
    """
    Get pipeline execution graph structure.
    
    Returns the DAG (directed acyclic graph) of the 4-stage agent pipeline.
    """
    try:
        # Try to get pipeline graph from orchestrator if available
        pipeline_graph = getattr(orchestrator, "pipeline_graph", None)
        if pipeline_graph:
            return {
                "nodes": ["planning", "research", "reasoning", "builder"],
                "edges": [
                    ["planning", "research"],
                    ["research", "reasoning"],
                    ["reasoning", "builder"],
                ],
                "description": "Sequential 4-stage agent pipeline",
            }
        return {
            "nodes": ["planning", "research", "reasoning", "builder"],
            "edges": [
                ["planning", "research"],
                ["research", "reasoning"],
                ["reasoning", "builder"],
            ],
            "description": "Sequential 4-stage agent pipeline",
        }
    except Exception as e:
        return {
            "error": str(e),
            "nodes": ["planning", "research", "reasoning", "builder"],
            "edges": [
                ["planning", "research"],
                ["research", "reasoning"],
                ["reasoning", "builder"],
            ],
        }


# Phase-3: System Metrics Endpoint
@router.get("/metrics")
async def get_system_metrics(
    task_manager: TaskManager = Depends(get_task_manager),
):
    """
    Get system-wide metrics.
    
    Returns current metrics including:
    - Worker count and utilization
    - Queue size and throughput
    - Circuit breaker state
    - Memory and vector store statistics
    - System uptime
    """
    try:
        metrics = await _metrics_collector.collect(
            worker_pool=getattr(task_manager, "_pool", None),
            task_queue=getattr(task_manager, "_queue", None),
        )
        return metrics.to_dict()
    except Exception as e:
        # Fallback metrics if collection fails
        return {
            "error": str(e),
            "timestamp": asyncio.get_event_loop().time(),
            "version": "Phase-3",
        }

