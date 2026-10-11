"""Structured logging configuration for CareNexus."""

import logging
import sys
from datetime import datetime, timezone


class CareNexusFormatter(logging.Formatter):
    """Custom log formatter with structured output."""

    COLORS = {
        "DEBUG": "\033[36m",
        "INFO": "\033[32m",
        "WARNING": "\033[33m",
        "ERROR": "\033[31m",
        "CRITICAL": "\033[1;31m",
    }
    RESET = "\033[0m"

    def format(self, record: logging.LogRecord) -> str:
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")
        color = self.COLORS.get(record.levelname, "")
        reset = self.RESET

        return (
            f"{color}{timestamp} | {record.levelname:<8}{reset} | "
            f"{record.name}:{record.funcName}:{record.lineno} — {record.getMessage()}"
        )


def setup_logging(level: str = "INFO") -> None:
    """Configure application-wide structured logging."""
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, level.upper(), logging.INFO))

    # Console handler with colored output
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(CareNexusFormatter())
    root_logger.addHandler(console_handler)

    # Suppress noisy third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
