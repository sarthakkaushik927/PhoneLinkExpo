"""
app/services/connection_manager.py
===================================
ConnectionManager: the single source of truth for active WebSocket connections.

Responsibilities:
    - Register connected clients.
    - Unregister disconnected clients.
    - Send a typed payload to a specific client.
    - Broadcast a typed payload to all (or all-except-one) clients.

Design notes:
    - Instantiated once inside ``WebSocketServer.__init__()`` and injected
      into all handlers — never imported as a global singleton here.
    - All send/broadcast methods are coroutines, compatible with asyncio.gather.
"""

from __future__ import annotations

import asyncio
import json

import websockets
from websockets.exceptions import ConnectionClosed

from ..utils.logger import get_logger

logger = get_logger(__name__)


class ConnectionManager:
    """
    Manages the lifecycle of all active WebSocket connections.

    Args:
        None — instantiate with ``ConnectionManager()``.
    """

    def __init__(self) -> None:
        self._clients: set[websockets.WebSocketServerProtocol] = set()

    # ── Registration ──────────────────────────────────────────────────────────

    def register(self, websocket: websockets.WebSocketServerProtocol) -> None:
        """Add a newly connected client to the active set."""
        self._clients.add(websocket)
        logger.info(
            f"✅  Registered   {websocket.remote_address}  "
            f"(active: {len(self._clients)})"
        )

    def unregister(self, websocket: websockets.WebSocketServerProtocol) -> None:
        """Remove a disconnected client from the active set."""
        self._clients.discard(websocket)
        logger.info(
            f"🔌  Unregistered {websocket.remote_address}  "
            f"(remaining: {len(self._clients)})"
        )

    # ── Messaging ─────────────────────────────────────────────────────────────

    async def send(
        self,
        websocket: websockets.WebSocketServerProtocol,
        payload: dict,
    ) -> bool:
        """
        Send a JSON payload to a single client.

        Args:
            websocket: Target client connection.
            payload:   JSON-serialisable dictionary.

        Returns:
            ``True`` if the payload was delivered; ``False`` if the socket
            was already closed.
        """
        try:
            await websocket.send(json.dumps(payload))
            logger.debug(f"TX → {websocket.remote_address}: {payload}")
            return True
        except ConnectionClosed:
            logger.warning(
                f"Send skipped — {websocket.remote_address} already closed."
            )
            return False

    async def broadcast(
        self,
        payload: dict,
        *,
        exclude: websockets.WebSocketServerProtocol | None = None,
    ) -> None:
        """
        Broadcast a JSON payload to all connected clients.

        Args:
            payload: JSON-serialisable dictionary.
            exclude: Optional client to skip (e.g. the message originator).
        """
        if not self._clients:
            return
        targets = self._clients - {exclude} if exclude else set(self._clients)
        data = json.dumps(payload)
        await asyncio.gather(
            *(client.send(data) for client in targets),
            return_exceptions=True,
        )
        logger.debug(f"Broadcast → {len(targets)} client(s): {payload}")

    # ── Properties ────────────────────────────────────────────────────────────

    @property
    def count(self) -> int:
        """Number of currently active connections."""
        return len(self._clients)
