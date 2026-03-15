# AXON API Documentation

AXON exposes a REST API served by FastAPI and a real-time WebSocket stream. All HTTP endpoints are prefixed with the base URL (default `http://127.0.0.1:8000`).

## Authentication

Every protected endpoint requires an `X-API-Key` header. Set the key via the `API_KEY` environment variable in the backend.

```
X-API-Key: <your-api-key>
```

## Index

| Route group | Base path | Description |
|-------------|-----------|-------------|
| [Health](#health) | `/health` | Liveness probe |
| [Tasks](tasks.md) | `/tasks` | Create and manage agent tasks |
| [Evolution](evolution.md) | `/evolution` | Trigger and inspect the self-evolution cycle |
| [Skills](skills.md) | `/skills` | Browse registered skills |
| [System](system.md) | `/system` | Platform status, pipeline graph and metrics |
| [WebSocket](websocket.md) | `/ws/events` | Real-time event stream |

---

## Health

### `GET /health`

Public liveness probe. No authentication required.

**Response `200 OK`**

```json
{ "status": "ok" }
```

---

## Quick navigation

- [Tasks API →](tasks.md)
- [Evolution API →](evolution.md)
- [Skills API →](skills.md)
- [System API →](system.md)
- [WebSocket API →](websocket.md)
