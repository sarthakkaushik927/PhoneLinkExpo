"""
app/config.py
=============
Centralised configuration. All tuneable values are sourced from environment
variables (via python-dotenv), with safe defaults so the server works
out-of-the-box without a .env file.

Usage:
    from app.config import config

    print(config.PORT)  # 8765
"""

import os

from dotenv import load_dotenv

load_dotenv()


class _Config:
    """
    Singleton-style configuration object.

    Instantiated once at module level and exported as `config`.
    Consume it via `from app.config import config` — never instantiate directly.
    """

    HOST: str = os.getenv("HOST", "0.0.0.0")
    """Network interface to bind to. ``0.0.0.0`` accepts all LAN connections."""

    PORT: int = int(os.getenv("PORT", "8765"))
    """WebSocket port. Must match ``SERVER_PORT`` in the mobile client config."""

    ACCEPT_DELAY: int = int(os.getenv("ACCEPT_DELAY", "3"))
    """Seconds to wait before sending ``accept_call`` (simulates user reaction time)."""

    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO").upper()
    """Python logging level. Options: DEBUG, INFO, WARNING, ERROR, CRITICAL."""


config = _Config()
