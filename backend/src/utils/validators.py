def validate_task_payload(payload: dict) -> bool:
    return isinstance(payload, dict)
