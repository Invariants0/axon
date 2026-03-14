from __future__ import annotations

from src.config.dependencies import (
    get_event_bus,
    get_llm_service,
    get_orchestrator,
    get_skill_registry,
    get_task_manager,
    get_vector_store,
)


def verify_pipeline() -> dict:
    orchestrator = get_orchestrator()
    skill_registry = get_skill_registry()
    llm_service = get_llm_service()
    vector_store = get_vector_store()
    event_bus = get_event_bus()
    task_manager = get_task_manager()

    agents = getattr(orchestrator, "agents", {})
    report = {
        "orchestrator_instantiated": orchestrator is not None,
        "agents_connected": bool(agents),
        "agent_count": len(agents),
        "skills_registered": len(skill_registry.all()),
        "llm_initialized": llm_service is not None,
        "vector_store_initialized": vector_store is not None,
        "event_bus_running": event_bus.is_running,
        "task_queue": task_manager.status(),
    }
    report["ok"] = all(
        [
            report["orchestrator_instantiated"],
            report["agents_connected"],
            report["llm_initialized"],
            report["vector_store_initialized"],
            report["event_bus_running"],
        ]
    )
    return report
