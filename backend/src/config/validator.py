"""Configuration validation for AXON Phase-4.

Validates system configuration at startup to prevent runtime failures.
"""

from __future__ import annotations

import sys

from src.config.config import get_settings
from src.utils.logger import get_logger

logger = get_logger(__name__)


class ConfigValidator:
    """Validates AXON configuration."""

    @staticmethod
    def validate() -> bool:
        """
        Validate all critical configuration settings.
        
        Returns:
            True if all validations pass, False otherwise.
        """
        settings = get_settings()
        issues = []
        
        logger.info("Starting configuration validation")
        
        # ===== AXON MODE VALIDATION =====
        valid_modes = {"mock", "gemini", "gradient", "real"}
        if settings.axon_mode not in valid_modes:
            issues.append(
                f"Invalid AXON_MODE: {settings.axon_mode}. "
                f"Must be one of: {', '.join(valid_modes)}"
            )
        
        # ===== MODE-SPECIFIC VALIDATION =====
        if settings.axon_mode == "gemini":
            if not settings.gemini_api_key:
                issues.append(
                    "AXON_MODE=gemini requires GEMINI_API_KEY to be set"
                )
        
        if settings.axon_mode == "gradient":
            if not settings.gradient_api_key:
                issues.append(
                    "AXON_MODE=gradient requires GRADIENT_API_KEY to be set"
                )
        
        if settings.axon_mode == "real":
            required_urls = {
                "AXON_PLANNER_AGENT_URL": settings.axon_planner_agent_url,
                "AXON_RESEARCH_AGENT_URL": settings.axon_research_agent_url,
                "AXON_REASONING_AGENT_URL": settings.axon_reasoning_agent_url,
                "AXON_BUILDER_AGENT_URL": settings.axon_builder_agent_url,
            }
            for name, url in required_urls.items():
                if not url:
                    issues.append(
                        f"AXON_MODE=real requires {name} to be configured"
                    )
        
        # ===== DATABASE VALIDATION =====
        if not settings.database_url:
            issues.append("DATABASE_URL is not configured")
        elif not settings.database_url.startswith("postgresql"):
            # Warn but don't fail for sqlite/other for testing
            logger.warning(
                "Non-PostgreSQL database detected",
                database_url_scheme=settings.database_url.split(":")[0],
            )
        
        # ===== VECTOR STORE VALIDATION =====
        valid_vector_providers = {"chroma", "qdrant"}
        if settings.vector_db_provider not in valid_vector_providers:
            issues.append(
                f"Invalid VECTOR_DB_PROVIDER: {settings.vector_db_provider}. "
                f"Must be one of: {', '.join(valid_vector_providers)}"
            )
        
        if settings.vector_db_provider == "qdrant":
            if not settings.qdrant_url:
                issues.append(
                    "VECTOR_DB_PROVIDER=qdrant requires QDRANT_URL to be set"
                )
            if not settings.qdrant_api_key:
                issues.append(
                    "VECTOR_DB_PROVIDER=qdrant requires QDRANT_API_KEY to be set"
                )
        
        # ===== DISTRIBUTED QUEUE VALIDATION =====
        valid_queue_backends = {"inmemory", "redis"}
        if settings.axon_queue_backend not in valid_queue_backends:
            issues.append(
                f"Invalid AXON_QUEUE_BACKEND: {settings.axon_queue_backend}. "
                f"Must be one of: {', '.join(valid_queue_backends)}"
            )
        
        if settings.axon_queue_backend == "redis":
            if not settings.axon_redis_url:
                issues.append(
                    "AXON_QUEUE_BACKEND=redis requires AXON_REDIS_URL to be set"
                )
        
        # ===== TIMEOUTS VALIDATION =====
        if settings.axon_agent_timeout < 10:
            issues.append(
                f"AXON_AGENT_TIMEOUT too low: {settings.axon_agent_timeout}. "
                "Minimum is 10 seconds"
            )
        
        if settings.skill_execution_timeout < 5:
            issues.append(
                f"SKILL_EXECUTION_TIMEOUT too low: {settings.skill_execution_timeout}. "
                "Minimum is 5 seconds"
            )
        
        # ===== REPORT VALIDATION RESULTS =====
        if issues:
            logger.error("Configuration validation failed", issue_count=len(issues))
            for i, issue in enumerate(issues, 1):
                logger.error(f"  [{i}] {issue}")
            return False
        
        logger.info("Configuration validation passed")
        return True

    @staticmethod
    def get_config_summary() -> dict:
        """Get a summary of active configuration (for /system/config endpoint)."""
        settings = get_settings()
        
        return {
            "app_name": settings.app_name,
            "environment": settings.env,
            "axon_mode": settings.axon_mode,
            "test_mode": settings.test_mode,
            "debug_pipeline": settings.axon_debug_pipeline,
            "vector_store": settings.vector_db_provider,
            "queue_backend": settings.axon_queue_backend,
            "llm_provider": settings.axon_mode,  # Main LLM comes from mode
            "agent_timeout_sec": settings.axon_agent_timeout,
            "skill_timeout_sec": settings.skill_execution_timeout,
            "evolution_enabled": True,
            "version": "Phase-4",
        }
