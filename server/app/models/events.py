"""
app/models/events.py
====================
Typed, immutable event and action models for the WebSocket protocol.

Using frozen dataclasses keeps the models lightweight (no external deps)
while enforcing immutability and providing free ``__repr__`` / ``__eq__``.

Protocol reference:
    Mobile → Server:  IncomingCallEvent  {"event": "incoming_call", "caller": "..."}
    Server → Mobile:  AcceptCallAction   {"action": "accept_call"}
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class IncomingCallEvent:
    """
    Emitted by the mobile client when the user taps 'Simulate Incoming Call'.

    JSON shape::

        {"event": "incoming_call", "caller": "+91 98765 43210"}
    """

    event: str
    caller: str

    @staticmethod
    def from_dict(data: dict) -> IncomingCallEvent:
        """
        Deserialise a raw JSON payload dict into a typed ``IncomingCallEvent``.

        Args:
            data: Parsed JSON dictionary from the WebSocket message.

        Returns:
            A populated :class:`IncomingCallEvent` instance.
        """
        return IncomingCallEvent(
            event=data.get("event", ""),
            caller=data.get("caller", "Unknown"),
        )


@dataclass(frozen=True)
class AcceptCallAction:
    """
    Sent by the server back to the mobile client to indicate the call was accepted.

    JSON shape::

        {"action": "accept_call"}
    """

    action: str = field(default="accept_call")

    def to_dict(self) -> dict:
        """Serialise to a JSON-compatible dictionary for ``websocket.send()``."""
        return {"action": self.action}
