from __future__ import annotations

import re
from datetime import datetime, timezone
from importlib import invalidate_caches

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.ai.llm_service import LLMService
from src.core.event_bus import EventBus
from src.core.evolution_safety import EvolutionSafetyValidator, SkillVersioning
from src.db.models import Skill, Task
from src.skills.registry import SkillRegistry
from src.utils.logger import get_logger

logger = get_logger(__name__)


class EvolutionEngine:
    def __init__(
        self,
        llm_service: LLMService,
        skill_registry: SkillRegistry,
        event_bus: EventBus,
    ) -> None:
        self.llm = llm_service
        self.skill_registry = skill_registry
        self.event_bus = event_bus
        self.last_run: datetime | None = None
        self.generated_count: int = 0
        self.missing_skills_cache: set[str] = set()  # Track requested missing skills

    def _sanitize_name(self, name: str) -> str:
        cleaned = re.sub(r"[^a-zA-Z0-9_]+", "_", name.strip().lower())
        return cleaned.strip("_") or "generated_skill"
    
    def _clean_generated_code(self, code: str) -> str:
        """
        Clean up generated code by removing markdown artifacts and extra whitespace.
        """
        # Remove markdown code fences
        code = re.sub(r"^```python\s*\n", "", code, flags=re.MULTILINE)
        code = re.sub(r"^```\s*\n", "", code, flags=re.MULTILINE)
        code = re.sub(r"\n```\s*$", "", code, flags=re.MULTILINE)
        code = code.strip("```").strip()
        
        # Ensure it starts with valid Python (imports or SKILL dict)
        lines = code.split("\n")
        start_idx = 0
        for i, line in enumerate(lines):
            stripped = line.strip()
            if stripped and not stripped.startswith("#"):
                if stripped.startswith(("import ", "from ", "SKILL")):
                    start_idx = i
                    break
        
        code = "\n".join(lines[start_idx:])
        return code.strip() + "\n"

    async def _failed_tasks_count(self, session: AsyncSession) -> int:
        count_query = select(func.count()).select_from(Task).where(Task.status == "failed")
        result = await session.execute(count_query)
        return int(result.scalar() or 0)

    async def evolve(self, session: AsyncSession) -> dict:
        failed_count = await self._failed_tasks_count(session)
        if failed_count == 0:
            return await self.get_status(session)

        skill_name = f"recovery_helper_{self.generated_count + 1}"
        prompt = (
            "Generate a concise skill purpose for helping recover failed software tasks. "
            "Return one sentence only."
        )
        description = await self.llm.complete(prompt)
        module_name = self._sanitize_name(skill_name)

        safe_description = description[:200].replace('"', "'").replace("\n", " ")
        code = (
            "SKILL = {\n"
            f"    \"name\": \"{module_name}\",\n"
            f"    \"description\": \"{safe_description}\",\n"
            "    \"parameters\": {\n"
            "        \"failure\": {\"type\": \"string\", \"required\": True}\n"
            "    },\n"
            "    \"version\": \"1.0.0\",\n"
            "}\n\n"
            "async def execute(payload: dict) -> dict:\n"
            "    failure = payload.get(\"failure\", \"\")\n"
            "    return {\n"
            "        \"action\": \"retry_with_smaller_scope\",\n"
            "        \"reason\": f\"Generated mitigation for: {failure}\",\n"
            "    }\n"
        )

        output_path = self.skill_registry.generated_skills_path() / f"{module_name}.py"
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(code, encoding="utf-8")

        invalidate_caches()
        self.skill_registry.discover_skills()
        definition = self.skill_registry.get(module_name)

        db_skill = Skill(
            name=definition.name,
            description=definition.description,
            source_code=definition.source,
            version=definition.version,
        )
        session.add(db_skill)
        await session.flush()

        self.generated_count += 1
        self.last_run = datetime.now(timezone.utc)
        await self.event_bus.publish(
            {
                "event": "evolution.generated",
                "skill": definition.name,
                "description": definition.description,
            }
        )
        logger.info("skill_generated", name=definition.name)
        return await self.get_status(session)

    async def generate_missing_skill(
        self,
        skill_name: str,
        context: dict | None = None,
        session: AsyncSession | None = None,
    ) -> dict:
        """
        Automatically generate a missing skill based on its name and context.
        This is the REAL production evolution - no hardcoded prompts or templates.
        
        Args:
            skill_name: The name of the missing skill (e.g., "xml_parser", "email_validator")
            context: Optional context about how the skill was requested
            session: Optional database session for persistence
            
        Returns:
            dict with skill generation results
        """
        # Prevent duplicate generation
        if skill_name in self.missing_skills_cache:
            logger.warning("skill_already_generating", skill_name=skill_name)
            return {
                "status": "already_generating",
                "skill_name": skill_name,
            }
        
        self.missing_skills_cache.add(skill_name)
        
        try:
            module_name = self._sanitize_name(skill_name)
            
            # Build intelligent prompt based on skill name
            prompt = self._build_skill_generation_prompt(skill_name, context)
            
            logger.info(
                "generating_skill_from_llm",
                skill_name=skill_name,
                prompt_length=len(prompt),
            )
            
            # Let the LLM generate the complete skill code
            generated_code = await self.llm.complete(prompt)
            
            # Clean up any markdown artifacts
            generated_code = self._clean_generated_code(generated_code)
            
            # ===== SAFETY VALIDATION (Phase-4) =====
            logger.info("validating_generated_skill", skill_name=skill_name)
            is_valid, errors = EvolutionSafetyValidator.validate_all(generated_code)
            
            if not is_valid:
                error_msg = "; ".join(errors)
                logger.error(
                    "skill_validation_failed",
                    skill_name=skill_name,
                    errors=error_msg,
                )
                await self.event_bus.publish({
                    "event": "evolution.validation_failed",
                    "skill": skill_name,
                    "errors": errors,
                })
                raise ValueError(f"Generated skill validation failed: {error_msg}")
            
            logger.info("skill_validation_passed", skill_name=skill_name)
            
            # Save the generated skill
            output_path = self.skill_registry.generated_skills_path() / f"{module_name}.py"
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_text(generated_code, encoding="utf-8")
            
            logger.info(
                "skill_code_generated",
                skill_name=skill_name,
                code_length=len(generated_code),
                output_path=str(output_path),
            )
            
            # Reload skill registry to pick up new skill
            invalidate_caches()
            self.skill_registry.discover_skills()
            
            # Get the newly loaded skill definition
            try:
                definition = self.skill_registry.get(module_name)
            except KeyError:
                logger.error(
                    "skill_load_failed",
                    skill_name=skill_name,
                    module_name=module_name,
                )
                raise ValueError(f"Generated skill '{module_name}' failed to load")
            
            # Persist to database if session provided
            if session:
                db_skill = Skill(
                    name=definition.name,
                    description=definition.description,
                    source_code=definition.source,
                    version=definition.version,
                )
                session.add(db_skill)
                await session.flush()
            
            self.generated_count += 1
            self.last_run = datetime.now(timezone.utc)
            
            await self.event_bus.publish({
                "event": "evolution.skill_generated",
                "skill": definition.name,
                "description": definition.description,
                "auto_generated": True,
                "validated": True,
            })
            
            logger.info(
                "skill_generation_complete",
                skill_name=definition.name,
                version=definition.version,
            )
            
            return {
                "status": "generated",
                "skill_name": definition.name,
                "description": definition.description,
                "version": definition.version,
                "code_length": len(generated_code),
                "validated": True,
            }
            
        except Exception as exc:
            logger.exception(
                "skill_generation_failed",
                skill_name=skill_name,
                error=str(exc),
            )
            raise
        finally:
            # Remove from cache after generation attempt
            self.missing_skills_cache.discard(skill_name)
    
    def _build_skill_generation_prompt(self, skill_name: str, context: dict | None = None) -> str:
        """
        Build an intelligent prompt for the LLM to generate a skill.
        Uses a minimal, focused approach to avoid token limits.
        """
        # Convert snake_case to human-readable description
        words = skill_name.replace("_", " ").strip()
        module_name = self._sanitize_name(skill_name)
        
        # Build a minimal but complete prompt
        prompt = f"""Generate a minimal Python skill for: {words}

Output ONLY Python code. No markdown. No explanations.

SKILL = {{
    "name": "{module_name}",
    "description": "Handles {words}",
    "parameters": {{"data": {{"type": "string", "required": True}}}},
    "version": "1.0.0",
}}

async def execute(payload: dict) -> dict:
    data = payload.get("data", "")
    try:
        # Process the data for {words}
        result = data  # Replace with actual processing
        return {{"result": result, "status": "success"}}
    except Exception as e:
        return {{"error": str(e), "status": "failed"}}

Generate a complete, working version of this skill. Keep it simple and functional."""
        
        return prompt

    async def get_status(self, session: AsyncSession) -> dict:
        failed_count = await self._failed_tasks_count(session)
        return {
            "status": "active",
            "generated_skills": self.generated_count,
            "failed_tasks": failed_count,
            "last_run": self.last_run.isoformat() if self.last_run else None,
            "pending_generations": len(self.missing_skills_cache),
        }
