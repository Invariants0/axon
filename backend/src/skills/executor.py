"""
Skill executor with timeout and error handling for AXON pipeline.
Automatically triggers evolution engine when skills are missing.
"""

from __future__ import annotations

import asyncio
import inspect
from typing import Any, TYPE_CHECKING

from src.config.config import get_settings
from src.skills.registry import SkillRegistry
from src.utils.logger import get_logger

if TYPE_CHECKING:
    from src.core.evolution_engine import EvolutionEngine
    from sqlalchemy.ext.asyncio import AsyncSession

logger = get_logger(__name__)


class SkillExecutionError(Exception):
    """Raised when skill execution fails."""
    pass


class SkillExecutor:
    def __init__(self, registry: SkillRegistry) -> None:
        self.registry = registry
        self.settings = get_settings()
        self.evolution_engine: EvolutionEngine | None = None
        self.auto_evolve_enabled: bool = True  # Enable automatic skill generation
    
    def set_evolution_engine(self, engine: EvolutionEngine) -> None:
        """Set the evolution engine for automatic skill generation."""
        self.evolution_engine = engine
        logger.info("evolution_engine_connected", auto_evolve=self.auto_evolve_enabled)

    def _validate(self, expected: dict[str, Any], payload: dict[str, Any]) -> None:
        for key, spec in expected.items():
            is_required = bool(spec.get("required", False)) if isinstance(spec, dict) else False
            if is_required and key not in payload:
                raise ValueError(f"Missing required parameter: {key}")

    async def execute(
        self,
        name: str,
        payload: dict | None = None,
        session: AsyncSession | None = None,
        context: dict | None = None,
    ) -> dict:
        """
        Execute a skill by name. If the skill is missing and evolution is enabled,
        automatically generate it.
        
        Args:
            name: Skill name to execute
            payload: Input parameters for the skill
            session: Optional database session for evolution persistence
            context: Optional context about how the skill was requested
            
        Returns:
            dict with skill execution results
        """
        payload = payload or {}
        
        try:
            skill = self.registry.get(name)
        except KeyError as exc:
            # Skill not found - try to auto-generate if evolution is enabled
            if self.evolution_engine and self.auto_evolve_enabled:
                logger.info(
                    "skill_missing_auto_generating",
                    skill_name=name,
                    auto_evolve=True,
                )
                
                try:
                    # Automatically generate the missing skill
                    result = await self.evolution_engine.generate_missing_skill(
                        skill_name=name,
                        context=context,
                        session=session,
                    )
                    
                    if result["status"] == "generated":
                        logger.info(
                            "skill_auto_generated_retrying",
                            skill_name=name,
                        )
                        # Retry execution with newly generated skill
                        return await self.execute(name, payload, session, context)
                    
                except Exception as gen_exc:
                    logger.exception(
                        "skill_auto_generation_failed",
                        skill_name=name,
                        error=str(gen_exc),
                    )
                    raise SkillExecutionError(
                        f"Skill '{name}' not found and auto-generation failed: {gen_exc}"
                    ) from gen_exc
            
            # Evolution not enabled or failed
            logger.error("skill_not_found", skill_name=name, auto_evolve=False)
            raise SkillExecutionError(f"Skill not found: {name}") from exc
        
        self._validate(skill.parameters, payload)

        timeout = self.settings.skill_execution_timeout
        
        try:
            if inspect.iscoroutinefunction(skill.execute):
                result = await asyncio.wait_for(skill.execute(payload), timeout=timeout)
            else:
                # Run sync function in executor with timeout
                loop = asyncio.get_event_loop()
                result = await asyncio.wait_for(
                    loop.run_in_executor(None, skill.execute, payload),
                    timeout=timeout,
                )
            
            logger.info(
                "skill_executed",
                skill_name=name,
                version=skill.version,
                output_size=len(str(result)),
            )
            
            return {
                "skill": skill.name,
                "version": skill.version,
                "output": result,
            }
            
        except asyncio.TimeoutError as exc:
            logger.error(
                "skill_timeout",
                skill_name=name,
                timeout=timeout,
            )
            raise SkillExecutionError(
                f"Skill '{name}' execution timeout after {timeout}s"
            ) from exc
            
        except Exception as exc:
            logger.exception(
                "skill_execution_failed",
                skill_name=name,
                error=str(exc),
            )
            raise SkillExecutionError(
                f"Skill '{name}' execution failed: {exc}"
            ) from exc
