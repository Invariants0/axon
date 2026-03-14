from __future__ import annotations

import importlib
import inspect
import pkgutil
from dataclasses import dataclass
from pathlib import Path
from types import ModuleType
from typing import Any, Callable


@dataclass
class SkillDefinition:
    name: str
    description: str
    parameters: dict[str, Any]
    execute: Callable[[dict[str, Any]], Any]
    source: str
    version: str = "1.0.0"


class SkillRegistry:
    def __init__(self) -> None:
        self._skills: dict[str, SkillDefinition] = {}
        self.discover_skills()

    def _iter_modules(self, package_name: str) -> list[ModuleType]:
        package = importlib.import_module(package_name)
        modules: list[ModuleType] = []
        for module_info in pkgutil.iter_modules(package.__path__, package.__name__ + "."):
            if module_info.name.endswith(".__init__"):
                continue
            modules.append(importlib.import_module(module_info.name))
        return modules

    def _build_definition(self, module: ModuleType) -> SkillDefinition | None:
        metadata = getattr(module, "SKILL", None)
        execute = getattr(module, "execute", None)
        if metadata is None and hasattr(module, "run"):
            execute = getattr(module, "run")
            metadata = {
                "name": module.__name__.split(".")[-1],
                "description": f"Skill from {module.__name__}",
                "parameters": {},
                "version": "1.0.0",
            }
        if not metadata or not callable(execute):
            return None
        return SkillDefinition(
            name=metadata.get("name", module.__name__),
            description=metadata.get("description", ""),
            parameters=metadata.get("parameters", {}),
            version=metadata.get("version", "1.0.0"),
            execute=execute,
            source=inspect.getsource(module),
        )

    def discover_skills(self) -> None:
        self._skills.clear()
        for package in ("src.skills.core_skills", "src.skills.generated_skills"):
            for module in self._iter_modules(package):
                definition = self._build_definition(module)
                if definition:
                    self._skills[definition.name] = definition

    def register_dynamic_skill(self, module_name: str) -> SkillDefinition:
        module = importlib.import_module(module_name)
        definition = self._build_definition(module)
        if not definition:
            raise ValueError(f"Invalid skill module: {module_name}")
        self._skills[definition.name] = definition
        return definition

    def register_definition(self, definition: SkillDefinition) -> None:
        self._skills[definition.name] = definition

    def all(self) -> list[SkillDefinition]:
        return list(self._skills.values())

    def get(self, name: str) -> SkillDefinition:
        skill = self._skills.get(name)
        if not skill:
            raise KeyError(f"Skill not found: {name}")
        return skill

    def generated_skills_path(self) -> Path:
        return Path(__file__).resolve().parent / "generated_skills"
