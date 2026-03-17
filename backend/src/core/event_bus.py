from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable
from datetime import datetime
from typing import Any

Subscriber = Callable[[dict], Awaitable[None]]


class EventBus:
    """
    Global event distribution system.
    
    All events follow strict structure:
    {
        "event": "event.name",
        "trace_id": "...",
        "task_id": "...",
        "timestamp": "2026-03-17T...",
        "data": {...}
    }
    """

    def __init__(self) -> None:
        self._subscribers: list[Subscriber] = []
        self._lock = asyncio.Lock()
        self._running = True
        self._event_count = 0

    async def subscribe(self, callback: Subscriber) -> None:
        """Register event subscriber."""
        async with self._lock:
            self._subscribers.append(callback)

    async def unsubscribe(self, callback: Subscriber) -> None:
        """Unregister event subscriber."""
        async with self._lock:
            self._subscribers = [sub for sub in self._subscribers if sub != callback]

    async def publish(self, event: dict) -> None:
        """
        Publish event to all subscribers.
        
        Event must contain:
        - event: event name
        - trace_id: global trace identifier
        - timestamp: ISO 8601 timestamp
        - data: event payload
        """
        # Normalize event structure
        if "timestamp" not in event:
            event["timestamp"] = datetime.utcnow().isoformat() + "Z"
        
        self._event_count += 1
        
        async with self._lock:
            subscribers = list(self._subscribers)
        
        if not subscribers:
            return
        
        await asyncio.gather(
            *(sub(event) for sub in subscribers),
            return_exceptions=True
        )

    @property
    def is_running(self) -> bool:
        """Check if event bus is running."""
        return self._running

    async def subscriber_count(self) -> int:
        """Get count of registered subscribers."""
        async with self._lock:
            return len(self._subscribers)

    @property
    def event_count(self) -> int:
        """Get total events published since start."""
        return self._event_count
