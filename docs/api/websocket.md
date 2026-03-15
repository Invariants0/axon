# WebSocket API

Endpoint: `ws://127.0.0.1:8000/ws/events`

AXON streams all internal EventBus events to connected WebSocket clients in real time. This is the primary channel for live dashboard updates.

## Index

| Path | Protocol | Description |
|------|----------|-------------|
| [/ws/events](#event-stream) | WebSocket | Subscribe to all AXON platform events |

---

## Event stream

### `WS /ws/events`

Connect to receive a continuous stream of platform events. The connection does **not** require the `X-API-Key` header but the base URL must be reachable from the client.

### Connection lifecycle

1. Open a WebSocket connection to `/ws/events`.
2. The server sends an initial confirmation message.
3. All subsequent messages are JSON event objects emitted by the internal EventBus.
4. The connection stays open until the client disconnects.

### Initial message

```json
{
  "event": "connected",
  "message": "AXON event stream connected"
}
```

### Event message shape

Each event follows the structure published by the EventBus. The `event` field identifies the event type; the remaining fields are event-specific.

```json
{
  "event": "<event-type>",
  "data": { ... }
}
```

Common event types:

| Event type | Description |
|------------|-------------|
| `task.created` | A new task was submitted |
| `task.updated` | A task changed status |
| `task.completed` | A task finished successfully |
| `evolution.started` | An evolution cycle started |
| `evolution.completed` | An evolution cycle finished |
| `skill.created` | A new skill was registered |

### JavaScript example

```javascript
import { createEventSocket } from "@/services/websocket";

const socket = createEventSocket();

socket.addEventListener("message", (event) => {
  const data = JSON.parse(event.data);
  console.log(data.event, data);
});

socket.addEventListener("close", () => {
  console.log("Disconnected from AXON event stream");
});
```

The helper `createEventSocket()` in `frontend/src/services/websocket.ts` reads the base URL from the `NEXT_PUBLIC_WS_BASE_URL` environment variable (default: `ws://127.0.0.1:8000`).

---

## See also

- [API Index](README.md)
- [System API](system.md)
- [Tasks API](tasks.md)
