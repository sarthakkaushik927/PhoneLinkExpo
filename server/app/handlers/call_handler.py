"""
app/handlers/call_handler.py
============================
CallHandler: processes incoming-call events and orchestrates the server response.

Design principles:
    - Intentionally **stateless**: no instance variables other than the injected
      ``ConnectionManager``. All mutable state lives in the manager.
    - Each public method maps 1-to-1 to an event type, making routing trivial.
    - Business logic is isolated here and unit-testable by mocking the manager.
"""

from __future__ import annotations

import asyncio

import websockets

from ..config import config
from ..models.events import AcceptCallAction, IncomingCallEvent
from ..services.connection_manager import ConnectionManager
from ..utils.logger import get_logger

logger = get_logger(__name__)


class CallHandler:
    """
    Handles all call-related WebSocket events.

    Args:
        manager: Shared :class:`~app.services.connection_manager.ConnectionManager`
                 instance, injected by :class:`~app.server.WebSocketServer`.
    """

    def __init__(self, manager: ConnectionManager) -> None:
        self._manager = manager

    async def handle_incoming_call(
        self,
        websocket: websockets.WebSocketServerProtocol,
        event: IncomingCallEvent,
    ) -> None:
        """
        Process an ``incoming_call`` event.

        Workflow:
            1. Log the caller ID to the terminal.
            2. Sleep for ``config.ACCEPT_DELAY`` seconds (simulates user reaction time).
            3. Send ``{"action": "accept_call"}`` back to the originating client.

        Args:
            websocket: Connection that originated the ``incoming_call`` event.
            event:     Deserialised, typed event payload.
        """
        logger.info(f"📞  Incoming call from: {event.caller}")
        logger.info(
            f"    Simulating {config.ACCEPT_DELAY}s reaction time "
            f"(non-blocking — other clients remain active) …"
        )

        await asyncio.sleep(config.ACCEPT_DELAY)

        response = AcceptCallAction()
        success = await self._manager.send(websocket, response.to_dict())

        if success:
            logger.info(f"✔   accept_call delivered to {websocket.remote_address}")
        else:
            logger.error(
                f"✘   Failed to deliver accept_call — "
                f"{websocket.remote_address} disconnected before response."
            )
