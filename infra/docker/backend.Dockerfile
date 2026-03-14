# Stage 1: Build stage
FROM ghcr.io/astral-sh/uv:python3.11-bookworm as builder

WORKDIR /app

COPY backend/pyproject.toml backend/uv.lock* ./

RUN uv sync --frozen-lock

COPY backend/ ./

# Stage 2: Final stage
FROM python:3.11-slim

WORKDIR /app

COPY --from=builder /app/.venv ./.venv
COPY --from=builder /app/src ./src
COPY --from=builder /app/alembic ./alembic
COPY --from=builder /app/alembic.ini ./

ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
