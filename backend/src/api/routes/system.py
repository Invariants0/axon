from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def get_system_status() -> dict:
    return {"message": "system route placeholder", "status": "ready"}
