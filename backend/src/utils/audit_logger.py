from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING

from src.config.dependencies import (
    get_app_settings,
    get_event_bus,
    get_orchestrator,
    get_skill_registry,
    get_task_manager,
    get_vector_store,
)
from src.db.models import Base

if TYPE_CHECKING:
    from fastapi import FastAPI


def _route_paths(app: "FastAPI") -> list[str]:
    paths: set[str] = set()
    for route in app.routes:
        path = getattr(route, "path", "")
        if path:
            paths.add(path)
    return sorted(paths)


def generate_audit_log(app: "FastAPI", output_path: Path | None = None) -> Path:
    settings = get_app_settings()
    orchestrator = get_orchestrator()
    skill_registry = get_skill_registry()
    task_manager = get_task_manager()
    vector_store = get_vector_store()
    event_bus = get_event_bus()

    skills = sorted([skill.name for skill in skill_registry.all()])
    agents = sorted(type(agent).__name__ for agent in orchestrator.agents.values())
    tables = sorted(Base.metadata.tables.keys())
    routes = _route_paths(app)

    memory_status = "ok"
    try:
        vector_store.collection.count()
    except Exception:
        memory_status = "error"

    lines = [
        "# AXON RUNTIME AUDIT",
        "",
        "## API ROUTES",
    ]
    lines.extend(routes or ["none"])
    lines.extend(
        [
            "",
            "## AGENTS",
        ]
    )
    lines.extend(agents or ["none"])
    lines.extend(
        [
            "",
            "## SKILLS",
        ]
    )
    lines.extend(skills or ["none"])
    lines.extend(
        [
            "",
            "## DATABASE",
            f"tables: {', '.join(tables) if tables else 'none'}",
            "",
            "## ENVIRONMENT",
            f"app_name: {settings.app_name}",
            f"env: {settings.env}",
            f"test_mode: {settings.test_mode}",
            f"vector_db_path: {settings.vector_db_path}",
            "",
            "## TASK QUEUE",
            f"status: {task_manager.status()}",
            f"queued_items: {task_manager.queue_size()}",
            "",
            "## VECTOR MEMORY",
            f"status: {memory_status}",
            "",
            "## EVENT BUS",
            f"status: {'running' if event_bus.is_running else 'stopped'}",
        ]
    )

    target = output_path or (Path(__file__).resolve().parents[2] / "audit.log")
    target.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return target
