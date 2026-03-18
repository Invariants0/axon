# AXON

AXON is a self-evolving AI agent platform scaffolded as a monorepo with a vanilla HTML/CSS/JS frontend and a FastAPI backend.

## Table of Contents

- [Project Structure](#project-structure)
- [Run Frontend](#run-frontend)
- [Run Backend](#run-backend)
- [Health Check](#health-check)
- [API Documentation](#api-documentation)
  - [Health](docs/api/README.md#health)
  - [Tasks API](docs/api/tasks.md)
  - [Evolution API](docs/api/evolution.md)
  - [Skills API](docs/api/skills.md)
  - [System API](docs/api/system.md)
  - [WebSocket API](docs/api/websocket.md)
- [Further Reading](#further-reading)

## Project Structure

- `frontend/`: Vanilla HTML, CSS, and JavaScript static files
- `backend/`: FastAPI (Python 3.11+, async-first skeleton)
- `utils/`: Operational scripts, test helpers, and architecture analysis tools
- `docker/`: Docker build configuration
- `nginx/`: Nginx runtime configuration
- `docs/`: Project documentation
  - [`docs/api/`](docs/api/README.md): REST and WebSocket API reference

## Run with Docker Compose

```bash
docker compose up --build
```

The app is served by nginx on http://localhost:80.
- Frontend runs in Next.js development mode with live rebuilds.
- Requests to `/api/*` are proxied to the backend (port 8000).
- WebSocket connections to `/ws/*` are proxied to the backend.

When iterating on the UI, regular `docker compose up` is enough. Changes in `frontend/` are mounted into the frontend container and trigger automatic rebuild/reload.

## Run Backend (standalone)

```bash
cd backend
python -m pip install -r requirements.txt
python start.py
```

Backend runs on http://127.0.0.1:8000.

The startup script runs database migrations before booting the API.

## Health Check

```bash
curl http://127.0.0.1:8000/health
```

## API Documentation

The full API reference is organised by route group. An [index with all endpoints](docs/api/README.md) is available in `docs/api/`.

| Route group | Base path | Docs |
|-------------|-----------|------|
| Health | `/health` | [docs/api/README.md](docs/api/README.md#health) |
| Tasks | `/tasks` | [docs/api/tasks.md](docs/api/tasks.md) |
| Evolution | `/evolution` | [docs/api/evolution.md](docs/api/evolution.md) |
| Skills | `/skills` | [docs/api/skills.md](docs/api/skills.md) |
| System | `/system` | [docs/api/system.md](docs/api/system.md) |
| WebSocket events | `/ws/events` | [docs/api/websocket.md](docs/api/websocket.md) |

When the backend is running, the interactive OpenAPI docs are available at http://127.0.0.1:8000/docs.

## Further Reading

- [Documentation Hub](docs/README.md)
- [Product Requirements Document](docs/AXON-(PRD).md)
- [Backend API architecture](backend/src/api/README.md)
