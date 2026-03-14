import asyncio

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect

from src.config.dependencies import get_event_bus
from src.core.event_bus import EventBus

router = APIRouter()


@router.websocket("/ws/events")
async def event_stream(websocket: WebSocket, event_bus: EventBus = Depends(get_event_bus)) -> None:
    await websocket.accept()
    queue: asyncio.Queue[dict] = asyncio.Queue()

    async def handler(event: dict) -> None:
        await queue.put(event)

    await event_bus.subscribe(handler)
    await websocket.send_json({"event": "connected", "message": "AXON event stream connected"})

    try:
        while True:
            event = await queue.get()
            await websocket.send_json(event)
    except WebSocketDisconnect:
        pass
    finally:
        await event_bus.unsubscribe(handler)
