from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()


class Settings(BaseSettings):
    model_config = SettingsConfigDict(case_sensitive=False, extra="ignore")

    app_name: str = "AXON"
    env: str = "development"
    test_mode: bool = Field(default=True, alias="TEST_MODE")
    api_key: str = Field(default="", alias="API_KEY")
    gradient_api_key: str = Field(default="", alias="GRADIENT_API_KEY")
    gradient_model: str = Field(default="gpt-4.1-mini", alias="GRADIENT_MODEL")
    gradient_base_url: str = Field(
        default="https://api.digitalocean.com/v2/ai",
        alias="GRADIENT_BASE_URL",
    )
    huggingface_api_key: str = Field(default="", alias="HUGGINGFACE_API_KEY")
    huggingface_model: str = Field(
        default="HuggingFaceH4/zephyr-7b-beta",
        alias="HUGGINGFACE_MODEL",
    )
    gemini_api_key: str = Field(default="", alias="GEMINI_API_KEY")
    gemini_model: str = Field(default="gemini-2.5-flash", alias="GEMINI_MODEL")
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/axon",
        alias="DATABASE_URL",
    )
    embedding_model: str = Field(
        default="sentence-transformers/all-MiniLM-L6-v2",
        alias="EMBEDDING_MODEL",
    )
    vector_db_path: str = Field(default="./.chroma", alias="VECTOR_DB_PATH")
    cors_origins: list[str] = Field(default_factory=lambda: ["*"], alias="CORS_ORIGINS")
    request_rate_limit_per_minute: int = Field(default=120, alias="RATE_LIMIT_PER_MIN")
    axon_mode: str = Field(default="mock", alias="AXON_MODE")
    digitalocean_api_token: str = Field(default="", alias="DIGITALOCEAN_API_TOKEN")
    gradient_model_access_key: str = Field(default="", alias="GRADIENT_MODEL_ACCESS_KEY")
    digitalocean_kb_uuid: str = Field(default="", alias="DIGITALOCEAN_KB_UUID")
    axon_agent_timeout: int = Field(default=120, alias="AXON_AGENT_TIMEOUT")
    axon_planner_agent_url: str = Field(default="", alias="AXON_PLANNER_AGENT_URL")
    axon_research_agent_url: str = Field(default="", alias="AXON_RESEARCH_AGENT_URL")
    axon_reasoning_agent_url: str = Field(default="", alias="AXON_REASONING_AGENT_URL")
    axon_builder_agent_url: str = Field(default="", alias="AXON_BUILDER_AGENT_URL")
    
    # Phase-3: Distributed Infrastructure
    axon_queue_backend: str = Field(default="inmemory", alias="AXON_QUEUE_BACKEND")
    axon_redis_url: str = Field(default="redis://localhost:6379", alias="AXON_REDIS_URL")
    axon_redis_queue_name: str = Field(default="axon:tasks", alias="AXON_REDIS_QUEUE_NAME")
    axon_breaker_backend: str = Field(default="memory", alias="AXON_BREAKER_BACKEND")
    
    # Hackathon Testing
    axon_api_key: str = Field(default="", alias="AXON_API_KEY")
    axon_debug_pipeline: bool = Field(default=False, alias="AXON_DEBUG_PIPELINE")
    skill_execution_timeout: int = Field(default=20, alias="SKILL_EXECUTION_TIMEOUT")

    def model_post_init(self, __context) -> None:
        """Resolve relative vector DB paths against backend root, not shell cwd."""
        vector_path = Path(self.vector_db_path).expanduser()
        if not vector_path.is_absolute():
            backend_root = Path(__file__).resolve().parents[2]
            vector_path = (backend_root / vector_path).resolve()
        object.__setattr__(self, "vector_db_path", str(vector_path))


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
