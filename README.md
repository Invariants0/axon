# AXON

AXON is a self-evolving AI agent platform scaffolded as a monorepo with a vanilla HTML/CSS/JS frontend and a FastAPI backend.

## Project Structure

- `frontend/`: Vanilla HTML, CSS, and JavaScript static files
- `backend/`: FastAPI (Python 3.11+, UV, async-first skeleton)
- `infra/`: Docker and Terraform configuration

## Run with Docker Compose

```bash
docker compose up --build
```

The app is served by nginx on http://localhost:80.
- Static frontend files are served directly by nginx.
- Requests to `/api/*` are proxied to the backend (port 8000).
- WebSocket connections to `/ws/*` are proxied to the backend.

## Run Backend (standalone)

```bash
cd backend
uv sync
uv run start.py
```

Backend runs on http://127.0.0.1:8000.

The startup script runs database migrations before booting the API.

## Health Check

```bash
curl http://127.0.0.1:8000/health
```
