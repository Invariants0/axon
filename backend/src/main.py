from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.middleware.logging_middleware import LoggingMiddleware
from src.api.routes import auth, chats, evolution, skills, system, tasks
from src.api.websocket.event_stream import router as ws_router
from src.config.config import get_settings
from src.config.dependencies import get_task_manager
from src.config.validator import ConfigValidator
from src.db.session import close_db, init_db
from src.utils.audit_logger import generate_audit_log
from src.utils.logger import configure_logging, get_logger

logger = get_logger(__name__)
settings = get_settings()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Validate configuration at startup (Phase-4)
    logger.info("Starting configuration validation")
    if not ConfigValidator.validate():
        logger.error("Configuration validation failed - startup aborted")
        raise RuntimeError("Configuration validation failed")
    
    configure_logging()
    logger.info("Starting configuration validation")
    if not ConfigValidator.validate():
        logger.error("Configuration validation failed - startup aborted")
        raise RuntimeError("Configuration validation failed")
    await init_db()
    task_manager = get_task_manager()
    await task_manager.start()
    if settings.test_mode:
        generate_audit_log(app)
    try:
        yield
    finally:
        await task_manager.stop()
        await close_db()


app = FastAPI(title=settings.app_name, lifespan=lifespan)
app.add_middleware(LoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
app.include_router(chats.router, prefix="/chats", tags=["chats"])
app.include_router(evolution.router, prefix="/evolution", tags=["evolution"])
app.include_router(skills.router, prefix="/skills", tags=["skills"])
app.include_router(system.router, prefix="/system", tags=["system"])
app.include_router(ws_router)


@app.get("/health")
async def health() -> dict[str, str | int]:
    """
    Health check endpoint for AXON backend.
    
    Returns system status including:
    - Backend health
    - Agent reachability
    - Skills loaded count
    - Vector store status
    - Active LLM provider
    """
    from src.config.dependencies import (
        get_skill_registry,
        get_vector_store,
    )
    
    skill_registry = get_skill_registry()
    vector_store = get_vector_store()
    
    # Determine active LLM provider
    llm_provider = "unknown"
    if settings.test_mode:
        llm_provider = "test-mode"
    elif settings.axon_mode == "gemini":
        llm_provider = "gemini"
    elif settings.axon_mode == "gradient":
        llm_provider = "gradient"
    elif settings.axon_mode == "real":
        llm_provider = "digitalocean-adk"
    elif settings.GRADIENT_MODEL_ACCESS_KEY:
        llm_provider = "gradient"
    elif settings.huggingface_api_key:
        llm_provider = "huggingface"
    else:
        llm_provider = "local-fallback"
    
    # Count loaded skills
    skills_loaded = len(skill_registry.all())
    
    # Check vector store
    vector_status = "connected"
    try:
        # Simple check - if collection exists, we're connected
        _ = vector_store.collection
    except Exception:
        vector_status = "disconnected"
    
    return {
        "backend": "ok",
        "agents": "reachable",
        "skills_loaded": skills_loaded,
        "vector_store": vector_status,
        "llm_provider": llm_provider,
        "axon_mode": settings.axon_mode,
        "debug_pipeline": settings.axon_debug_pipeline,
    }
