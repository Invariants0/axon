from src.schemas.task import TaskCreate


def validate_task_payload(payload: dict) -> bool:
    try:
        TaskCreate.model_validate(payload)
        return True
    except Exception:  # noqa: BLE001
        return False
