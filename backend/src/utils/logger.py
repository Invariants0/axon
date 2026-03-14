import sys

from loguru import logger

_configured = False


def configure_logging() -> None:
    global _configured
    if _configured:
        return
    logger.remove()
    logger.add(
        sys.stdout,
        serialize=True,
        level="INFO",
        backtrace=False,
        diagnose=False,
    )
    _configured = True


def get_logger(name: str):
    configure_logging()
    return logger.bind(module=name)
