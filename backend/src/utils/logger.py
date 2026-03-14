import sys
import os

from loguru import logger

_configured = False


def configure_logging() -> None:
    global _configured
    if _configured:
        return
    env = os.getenv("ENV", "development").strip().lower()
    # Default to readable logs in development; keep JSON logs in production.
    default_json = "true" if env in {"prod", "production"} else "false"
    log_json = os.getenv("LOG_JSON", default_json).strip().lower() in {"1", "true", "yes", "on"}
    log_level = os.getenv("LOG_LEVEL", "INFO").strip().upper() or "INFO"
    logger.remove()
    logger.add(
        sys.stdout,
        serialize=log_json,
        level=log_level,
        backtrace=False,
        diagnose=False,
    )
    _configured = True


def get_logger(name: str):
    configure_logging()
    return logger.bind(module=name)
