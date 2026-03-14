from __future__ import annotations

import inspect
from typing import Any

from src.skills.registry import SkillRegistry


class SkillExecutor:
    def __init__(self, registry: SkillRegistry) -> None:
        self.registry = registry

    def _validate(self, expected: dict[str, Any], payload: dict[str, Any]) -> None:
        for key, spec in expected.items():
            is_required = bool(spec.get("required", False)) if isinstance(spec, dict) else False
            if is_required and key not in payload:
                raise ValueError(f"Missing required parameter: {key}")

    async def execute(self, name: str, payload: dict | None = None) -> dict:
        payload = payload or {}
        skill = self.registry.get(name)
        self._validate(skill.parameters, payload)

        if inspect.iscoroutinefunction(skill.execute):
            result = await skill.execute(payload)
        else:
            result = skill.execute(payload)

        return {
            "skill": skill.name,
            "version": skill.version,
            "output": result,
        }
