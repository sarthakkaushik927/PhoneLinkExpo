"""
app/utils/logger.py
===================
Factory function that returns a named, colourised ``logging.Logger``.

Features:
- ANSI colour-coded log levels via the ``colorlog`` library.
- Log level driven by the ``LOG_LEVEL`` environment variable.
- Handler-deduplication guard: safe to call ``get_logger(__name__)``
  multiple times from the same module without stacking handlers.

Usage:
    from app.utils.logger import get_logger

    logger = get_logger(__name__)
    logger.info("Server started")
"""

import logging
import os

import colorlog

# Internal cache to prevent attaching duplicate handlers to the same logger.
_CONFIGURED: set[str] = set()


def get_logger(name: str) -> logging.Logger:
    """
    Return a named, colourised logger.

    Args:
        name: Typically ``__name__`` of the calling module.

    Returns:
        A configured :class:`logging.Logger` instance.
    """
    level_name: str = os.getenv("LOG_LEVEL", "INFO").upper()
    level: int = getattr(logging, level_name, logging.INFO)

    logger = logging.getLogger(name)

    if name not in _CONFIGURED:
        handler = colorlog.StreamHandler()
        handler.setFormatter(
            colorlog.ColoredFormatter(
                fmt=(
                    "%(log_color)s%(asctime)s "
                    "[%(levelname)-8s]%(reset)s "
                    "%(blue)s%(name)s%(reset)s — "
                    "%(message)s"
                ),
                datefmt="%H:%M:%S",
                log_colors={
                    "DEBUG":    "cyan",
                    "INFO":     "green",
                    "WARNING":  "yellow",
                    "ERROR":    "red",
                    "CRITICAL": "bold_red",
                },
            )
        )
        logger.addHandler(handler)
        logger.setLevel(level)
        logger.propagate = False  # Prevent double-logging via root logger
        _CONFIGURED.add(name)

    return logger
