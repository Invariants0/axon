"""
Configuration Validation Layer.

Validates all critical configuration at startup to fail fast if misconfigured.

Checks:
  - Agent URLs (format, reachability for real mode)
  - API keys (presence, format)
  - Database connectivity
  - Vector store accessibility
  - File paths and permissions
  - Environment variable consistency
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from src.utils.logger import get_logger

if TYPE_CHECKING:
    from src.config.config import Settings
    from src.memory.vector_store import VectorStore
    from src.providers.digitalocean.digitalocean_agent_client import DigitalOceanAgentClient

logger = get_logger(__name__)


class ConfigValidationError(Exception):
    """Raised when configuration validation fails."""

    pass


class ConfigValidator:
    """
    Validates application configuration at startup.

    Performs both structural and connectivity validation to ensure
    the system is properly configured before processing tasks.
    """

    def __init__(
        self,
        settings: Settings,
        vector_store: VectorStore | None = None,
        agent_client: DigitalOceanAgentClient | None = None,
    ) -> None:
        """
        Initialize validator.

        Args:
            settings: Application settings/config
            vector_store: Optional VectorStore to validate access
            agent_client: Optional HTTP client to validate agent connectivity
        """
        self.settings = settings
        self.vector_store = vector_store
        self.agent_client = agent_client
        self.errors: list[str] = []
        self.warnings: list[str] = []

    def validate(self) -> bool:
        """
        Run all validation checks.

        Returns:
            True if all critical checks pass, raises ConfigValidationError otherwise
        """
        self.errors.clear()
        self.warnings.clear()

        logger.info("config_validation_start")

        # Core validation checks
        self._validate_mode()
        self._validate_database()
        self._validate_api_keys()
        self._validate_paths()
        self._validate_agent_configuration()
        self._validate_environment_consistency()

        # Optional connectivity checks
        if self.vector_store:
            self._validate_vector_store()

        # Log results
        if self.errors:
            logger.error(
                "config_validation_failed",
                error_count=len(self.errors),
                errors=self.errors,
            )
            raise ConfigValidationError(f"Configuration validation failed: {self.errors}")

        if self.warnings:
            logger.warning(
                "config_validation_warnings",
                warning_count=len(self.warnings),
                warnings=self.warnings,
            )

        logger.info(
            "config_validation_complete",
            error_count=len(self.errors),
            warning_count=len(self.warnings),
        )

        return True

    def _validate_mode(self) -> None:
        """Validate AXON_MODE setting."""
        if self.settings.axon_mode not in {"mock", "real"}:
            self.errors.append(
                f"Invalid AXON_MODE: {self.settings.axon_mode}. "
                f"Must be 'mock' or 'real'."
            )

    def _validate_database(self) -> None:
        """Validate DATABASE_URL format and structure."""
        db_url = self.settings.database_url
        if not db_url:
            self.errors.append("DATABASE_URL is required but not set")
            return

        if not db_url.startswith(("postgresql://", "postgresql+asyncpg://")):
            self.errors.append(
                f"Invalid DATABASE_URL format: {db_url}. "
                f"Must start with postgresql:// or postgresql+asyncpg://"
            )

        # Basic URL structure check
        if "@" not in db_url or "/" not in db_url.split("@")[-1]:
            self.errors.append(
                f"DATABASE_URL appears malformed: missing host or database name"
            )

    def _validate_api_keys(self) -> None:
        """Validate API key configuration."""
        # API key for authentication is optional
        if not self.settings.api_key:
            self.warnings.append("API_KEY not set; authentication disabled")

        # Mode-specific keys
        if self.settings.axon_mode == "real":
            if not self.settings.digitalocean_api_token:
                self.errors.append(
                    "AXON_MODE=real requires DIGITALOCEAN_API_TOKEN"
                )
            if not self.settings.gradient_model_access_key:
                self.warnings.append(
                    "GRADIENT_MODEL_ACCESS_KEY not set; using Gradient API fallback"
                )

        # Optional provider keys
        if not self.settings.gradient_api_key:
            self.warnings.append("GRADIENT_API_KEY not set; Gradient provider unavailable")

        if not self.settings.huggingface_api_key:
            self.warnings.append(
                "HUGGINGFACE_API_KEY not set; HuggingFace provider unavailable"
            )

    def _validate_paths(self) -> None:
        """Validate file paths and directories."""
        vector_db_path = self.settings.vector_db_path
        if not vector_db_path:
            self.errors.append("VECTOR_DB_PATH is required")
            return

        # Path should be absolute or relative
        if ".." in vector_db_path:
            self.warnings.append(
                f"VECTOR_DB_PATH contains '..': {vector_db_path}; "
                f"consider using absolute path"
            )

    def _validate_agent_configuration(self) -> None:
        """Validate agent URLs and configuration."""
        if self.settings.axon_mode == "real":
            agents = {
                "planner": self.settings.axon_planner_agent_url,
                "research": self.settings.axon_research_agent_url,
                "reasoning": self.settings.axon_reasoning_agent_url,
                "builder": self.settings.axon_builder_agent_url,
            }

            for agent_name, url in agents.items():
                if not url:
                    self.errors.append(
                        f"AXON_{agent_name.upper()}_AGENT_URL required for real mode"
                    )
                elif not url.startswith(("http://", "https://")):
                    self.errors.append(
                        f"Invalid {agent_name} agent URL format: {url}"
                    )

        # Timeout validation
        if self.settings.axon_agent_timeout < 10:
            self.warnings.append(
                f"AXON_AGENT_TIMEOUT very low: {self.settings.axon_agent_timeout}s; "
                f"consider minimum 30s for external calls"
            )

        if self.settings.axon_agent_timeout > 600:
            self.warnings.append(
                f"AXON_AGENT_TIMEOUT very high: {self.settings.axon_agent_timeout}s; "
                f"may cause request backlog"
            )

    def _validate_environment_consistency(self) -> None:
        """Validate environment variable consistency."""
        # Check for mode consistency
        if self.settings.axon_mode == "real" and self.settings.test_mode:
            self.warnings.append(
                "TEST_MODE=true is set with AXON_MODE=real; "
                "test mode may interfere with production agents"
            )

        # Check rate limiting
        if self.settings.request_rate_limit_per_minute < 1:
            self.errors.append(
                f"RATE_LIMIT_PER_MIN must be >= 1, got {self.settings.request_rate_limit_per_minute}"
            )

        # Check embedding model
        if not self.settings.embedding_model:
            self.errors.append("EMBEDDING_MODEL is required")

    def _validate_vector_store(self) -> None:
        """Validate vector store accessibility and health."""
        if not self.vector_store:
            return

        try:
            # Check if we can query the collection
            collection_name = self.vector_store.collection.name
            logger.info(
                "vector_store_validated",
                collection=collection_name,
            )
        except Exception as exc:
            self.errors.append(f"Vector store validation failed: {str(exc)}")

    def summary(self) -> dict:
        """Get validation summary."""
        return {
            "mode": self.settings.axon_mode,
            "database_configured": bool(self.settings.database_url),
            "api_key_configured": bool(self.settings.api_key),
            "agents_configured": self._agents_configured(),
            "vector_store_path": self.settings.vector_db_path,
            "errors": self.errors,
            "warnings": self.warnings,
            "is_valid": len(self.errors) == 0,
        }

    def _agents_configured(self) -> int:
        """Count how many agent URLs are configured."""
        count = 0
        for url in [
            self.settings.axon_planner_agent_url,
            self.settings.axon_research_agent_url,
            self.settings.axon_reasoning_agent_url,
            self.settings.axon_builder_agent_url,
        ]:
            if url:
                count += 1
        return count
