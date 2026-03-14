from pydantic import BaseModel


class SystemStatusResponse(BaseModel):
    status: str
    app: str
    environment: str
    database: str
    vector_store: str
    skills_loaded: int
    agents_ready: bool
    event_bus: str
    task_queue: str
