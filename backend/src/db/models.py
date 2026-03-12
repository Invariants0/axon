from pydantic import BaseModel


class TaskRecord(BaseModel):
    id: str
    title: str
