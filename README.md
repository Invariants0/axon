# AXON

AXON is a self-evolving AI agent platform scaffolded as a monorepo with a Next.js frontend and a FastAPI backend.

## Project Structure

- `frontend/`: Next.js (TypeScript, TailwindCSS, Bun, Biome)
- `backend/`: FastAPI (Python 3.11+, UV, async-first skeleton)

## Run Frontend

```bash
cd frontend
bun install
bun dev
```

Frontend runs on http://localhost:3000.

## Run Backend

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
