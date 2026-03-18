import argparse
import asyncio
import os
import socket
import subprocess
import sys
import time
from pathlib import Path
from urllib.parse import urlparse


DEFAULT_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@postgres:5432/axon"
DEFAULT_DOCKER_CONTAINER = "axon-postgres"


def wait_for_port(host: str, port: int, timeout_seconds: int = 25) -> bool:
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.settimeout(1.0)
            if sock.connect_ex((host, port)) == 0:
                return True
        time.sleep(1)
    return False


def ensure_local_postgres_with_docker(host: str, port: int, database_url: str) -> None:
    """Best-effort bootstrap for local dev: start dockerized Postgres if needed."""
    if host not in {"127.0.0.1", "localhost"}:
        return

    if wait_for_port(host, port, timeout_seconds=2):
        return

    try:
        subprocess.run(["docker", "info"], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        raise RuntimeError(
            "PostgreSQL is not reachable and Docker is unavailable. "
            "Start PostgreSQL manually for DATABASE_URL="
            f"{database_url}"
        )

    status = subprocess.run(
        [
            "docker",
            "ps",
            "-a",
            "--filter",
            f"name=^{DEFAULT_DOCKER_CONTAINER}$",
            "--format",
            "{{.Status}}",
        ],
        check=True,
        capture_output=True,
        text=True,
    ).stdout.strip()

    if not status:
        print(f"Starting local Postgres container '{DEFAULT_DOCKER_CONTAINER}'...")
        subprocess.run(
            [
                "docker",
                "run",
                "--name",
                DEFAULT_DOCKER_CONTAINER,
                "-e",
                "POSTGRES_PASSWORD=postgres",
                "-e",
                "POSTGRES_USER=postgres",
                "-e",
                "POSTGRES_DB=axon",
                "-p",
                f"{port}:5432",
                "-d",
                "postgres:16",
            ],
            check=True,
        )
    elif not status.lower().startswith("up"):
        print(f"Starting existing Postgres container '{DEFAULT_DOCKER_CONTAINER}'...")
        subprocess.run(["docker", "start", DEFAULT_DOCKER_CONTAINER], check=True)

    if not wait_for_port(host, port):
        raise RuntimeError(
            "PostgreSQL container started but port is still unreachable. "
            f"Expected host/port: {host}:{port}"
        )


def ensure_database_ready() -> None:
    database_url = os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)
    print(f"Ensuring database is ready at {database_url}...")
    parsed = urlparse(database_url)
    if not parsed.scheme.startswith("postgresql"):
        return

    host = parsed.hostname or "127.0.0.1"
    port = int(parsed.port or 5432)
    ensure_local_postgres_with_docker(host, port, database_url)


async def init_database() -> None:
    """Initialize database tables using SQLAlchemy."""
    from src.db.session import init_db
    try:
        await init_db()
        print("Database tables initialized successfully")
    except Exception as e:
        print(f"Error initializing database: {e}")
        raise


def main() -> None:
    parser = argparse.ArgumentParser(description="Start AXON backend")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload")
    parser.add_argument("--skip-db-init", action="store_true", help="Skip database initialization")
    parser.add_argument("--no-auto-db", action="store_true", help="Do not auto-start local Docker Postgres")
    args = parser.parse_args()

    project_dir = Path(__file__).resolve().parent

    # Only attempt to auto-start a local Postgres container when running in development.
    # In production/cloud, the database should be provided via DATABASE_URL.
    from src.config.config import get_settings

    settings = get_settings()

    if not args.skip_db_init:
        if not args.no_auto_db and settings.env.lower() == "development":
            ensure_database_ready()
        print("Initializing database tables...")
        print("Database URL:", settings.database_url)
        asyncio.run(init_database())

    print(f"Starting API on http://{args.host}:{args.port}")
    import uvicorn

    uvicorn.run(
        "src.main:app",
        app_dir=str(project_dir),
        host=args.host,
        port=args.port,
        reload=args.reload,
    )


if __name__ == "__main__":
    main()
