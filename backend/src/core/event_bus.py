from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable

Subscriber = Callable[[dict], Awaitable[None]]


class EventBus:
    def __init__(self) -> None:
        self._subscribers: list[Subscriber] = []
        self._lock = asyncio.Lock()
        self._running = True

    async def subscribe(self, callback: Subscriber) -> None:
        async with self._lock:
            self._subscribers.append(callback)

    async def unsubscribe(self, callback: Subscriber) -> None:
        async with self._lock:
            self._subscribers = [sub for sub in self._subscribers if sub != callback]

    async def publish(self, event: dict) -> None:
        async with self._lock:
            subscribers = list(self._subscribers)
        if not subscribers:
            return
        await asyncio.gather(*(sub(event) for sub in subscribers), return_exceptions=True)

    @property
    def is_running(self) -> bool:
        return self._running

    async def subscriber_count(self) -> int:
        async with self._lock:
            return len(self._subscribers)
