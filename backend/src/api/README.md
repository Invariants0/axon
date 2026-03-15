# AXON Backend API

This directory contains the FastAPI routing layer for the AXON backend.

## Structure

```
api/
├── controllers/          # Business-logic handlers (called by routes)
│   ├── evolution_controller.py
│   ├── skill_controller.py
│   └── task_controller.py
├── middleware/           # Starlette middleware
│   └── logging_middleware.py
├── routes/               # FastAPI routers (one file per domain)
│   ├── evolution.py      # /evolution
│   ├── skills.py         # /skills
│   ├── system.py         # /system
│   └── tasks.py          # /tasks
└── websocket/            # WebSocket endpoints
    └── event_stream.py   # /ws/events
```

## Registered routes

| Router module | Prefix | Tags |
|---------------|--------|------|
| `routes/tasks.py` | `/tasks` | `tasks` |
| `routes/evolution.py` | `/evolution` | `evolution` |
| `routes/skills.py` | `/skills` | `skills` |
| `routes/system.py` | `/system` | `system` |
| `websocket/event_stream.py` | *(none)* | — |
| `main.py` (inline) | `/health` | — |

See `src/main.py` for the `app.include_router(...)` calls.

## Authentication & rate limiting

All routers (except `/health` and `/ws/events`) share two FastAPI dependencies injected at the router level:

- **`require_api_key`** — validates the `X-API-Key` request header against the `API_KEY` environment variable.
- **`rate_limit_hook`** — enforces a per-client request rate limit.

Both are defined in `src/config/dependencies.py`.

## Adding a new route

1. Create a new file in `routes/`, e.g. `routes/myfeature.py`.
2. Define a `router = APIRouter(...)` with the shared dependencies.
3. Add controller functions in `controllers/` if the logic is non-trivial.
4. Register the router in `src/main.py`:
   ```python
   from src.api.routes import myfeature
   app.include_router(myfeature.router, prefix="/myfeature", tags=["myfeature"])
   ```
5. Add the corresponding API documentation in [`docs/api/`](../../../docs/api/).

## API documentation

Human-readable documentation for each endpoint lives in [`docs/api/`](../../../docs/api/):

- [API Index](../../../docs/api/README.md)
- [Tasks](../../../docs/api/tasks.md)
- [Evolution](../../../docs/api/evolution.md)
- [Skills](../../../docs/api/skills.md)
- [System](../../../docs/api/system.md)
- [WebSocket](../../../docs/api/websocket.md)

The interactive OpenAPI docs are also available at `http://127.0.0.1:8000/docs` when the server is running.
