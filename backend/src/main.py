from fastapi import FastAPI

from api.middleware.logging_middleware import LoggingMiddleware
from api.routes import evolution, skills, system, tasks
from api.websocket.event_stream import router as ws_router

app = FastAPI(title="AXON")
app.add_middleware(LoggingMiddleware)

app.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
app.include_router(evolution.router, prefix="/evolution", tags=["evolution"])
app.include_router(skills.router, prefix="/skills", tags=["skills"])
app.include_router(system.router, prefix="/system", tags=["system"])
app.include_router(ws_router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
