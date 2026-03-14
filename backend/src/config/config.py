from functools import lru_cache

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


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
