from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.middleware.logging_middleware import LoggingMiddleware
from src.api.routes import evolution, skills, system, tasks
from src.api.websocket.event_stream import router as ws_router
from src.config.config import get_settings
from src.config.dependencies import get_task_manager
from src.db.session import close_db, init_db
from src.utils.audit_logger import generate_audit_log
from src.utils.logger import configure_logging

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    configure_logging()
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

app.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
app.include_router(evolution.router, prefix="/evolution", tags=["evolution"])
app.include_router(skills.router, prefix="/skills", tags=["skills"])
app.include_router(system.router, prefix="/system", tags=["system"])
app.include_router(ws_router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
