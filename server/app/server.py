"""
app/server.py
=============
Interactive WebSocket server with a thread-safe stdin CLI.

Windows-compatible: stdin is read in a background thread and
commands are passed to asyncio via a Queue, avoiding the
run_in_executor / ProactorEventLoop issues on Windows.

Commands:
  a          → accept (answer) the ringing call on the phone
  r          → reject the ringing call
  d <number> → dial a number from the phone
  h          → hang up the active call
  s l        → route audio to Laptop (Bluetooth)
  s e        → route audio to Earpiece
  s s        → route audio to Speaker
  q          → quit
"""

from __future__ import annotations

import asyncio
import json
import queue
import sys
import threading

import websockets
from websockets.exceptions import ConnectionClosedError, ConnectionClosedOK

from .config import config
from .services.connection_manager import ConnectionManager
from .discovery import DiscoveryService
from .utils.logger import get_logger

logger = get_logger(__name__)

# ── ANSI colours ─────────────────────────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"


class WebSocketServer:
    def __init__(self) -> None:
        self._manager  = ConnectionManager()
        self._cmd_q: queue.Queue[str] = queue.Queue()
        self._discovery = None
        self._call_state = "idle"   # idle | ringing | active
        self._caller     = ""
        self._loop: asyncio.AbstractEventLoop | None = None

    # ── Public ────────────────────────────────────────────────────────────────

    def run(self) -> None:
        # Start stdin reader thread BEFORE asyncio.run()
        t = threading.Thread(target=self._stdin_reader, daemon=True)
        t.start()
        try:
            asyncio.run(self._main())
        except KeyboardInterrupt:
            print(f"\n{YELLOW}Bye! 👋{RESET}")
        finally:
            if self._discovery:
                self._discovery.stop()

    # ── Stdin thread (runs outside asyncio) ───────────────────────────────────

    def _stdin_reader(self) -> None:
        """Blocking readline in a daemon thread — puts lines into _cmd_q."""
        while True:
            try:
                line = sys.stdin.readline()
                if not line:          # EOF
                    self._cmd_q.put("q")
                    break
                self._cmd_q.put(line.strip())
            except Exception:
                break

    # ── Asyncio main ──────────────────────────────────────────────────────────

    async def _main(self) -> None:
        self._loop = asyncio.get_running_loop()
        await asyncio.gather(
            self._serve(),
            self._cli_loop(),
        )

    async def _serve(self) -> None:
        port = config.PORT
        while True:
            try:
                async with websockets.serve(self._handle_client, config.HOST, port):
                    self._print_banner(port)
                    
                    # Start UDP Discovery with the actual port
                    self._discovery = DiscoveryService(port=port)
                    self._discovery.start()
                    
                    self._print_prompt()
                    await asyncio.Future()  # Run forever
                break
            except OSError as e:
                # If port is in use, try the next one
                if e.errno == 10048 or e.errno == 98:
                    port += 1
                else:
                    raise

    # ── Per-client handler ────────────────────────────────────────────────────

    async def _handle_client(
        self, websocket: websockets.WebSocketServerProtocol
    ) -> None:
        self._manager.register(websocket)
        addr = websocket.remote_address
        print(f"\n{GREEN}📱  Phone connected: {addr}{RESET}")
        self._print_prompt()
        try:
            async for raw in websocket:
                await self._on_message(websocket, raw)
        except (ConnectionClosedOK, ConnectionClosedError):
            pass
        except Exception as exc:
            logger.error(f"Error: {exc}", exc_info=True)
        finally:
            self._manager.unregister(websocket)
            self._call_state = "idle"
            self._caller = ""
            print(f"\n{YELLOW}📱  Phone disconnected: {addr}{RESET}")
            self._print_prompt()

    async def _on_message(
        self,
        websocket: websockets.WebSocketServerProtocol,
        raw: str,
    ) -> None:
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            return

        event = payload.get("event")

        if event == "incoming_call":
            self._caller = payload.get("caller", "Unknown")
            self._call_state = "ringing"
            print(f"\n{BOLD}{RED}╔══════════════════════════════════════╗{RESET}")
            print(f"{BOLD}{RED}║  📲  INCOMING CALL                   ║{RESET}")
            print(f"{BOLD}{RED}║  From : {self._caller:<29}║{RESET}")
            print(f"{BOLD}{RED}║  [a] Answer      [r] Reject           ║{RESET}")
            print(f"{BOLD}{RED}╚══════════════════════════════════════╝{RESET}")
            self._print_prompt()

        elif event == "outgoing_call":
            callee = payload.get("callee", "Unknown")
            self._call_state = "active"
            print(f"\n{CYAN}📤  Outgoing call to {callee}   [h] to hang up{RESET}")
            self._print_prompt()

        elif event == "call_answered":
            self._call_state = "active"
            print(f"\n{GREEN}📞  Call answered on phone   [h] to hang up{RESET}")
            self._print_prompt()

        elif event in ("call_ended", "call_rejected"):
            self._call_state = "idle"
            self._caller = ""
            label = "ended" if event == "call_ended" else "rejected on phone"
            print(f"\n{YELLOW}📵  Call {label}.{RESET}")
            self._print_prompt()

        else:
            logger.debug(f"RX: {payload}")

    # ── CLI loop (polls the thread-safe queue) ────────────────────────────────

    async def _cli_loop(self) -> None:
        while True:
            # Yield control briefly, then check the queue
            await asyncio.sleep(0.1)
            while not self._cmd_q.empty():
                cmd = self._cmd_q.get_nowait().strip().lower()
                if not cmd:
                    continue
                await self._handle_cmd(cmd)

    async def _handle_cmd(self, cmd: str) -> None:
        if cmd == "q":
            print("Shutting down…")
            sys.exit(0)

        elif cmd == "a":
            await self._broadcast({"action": "accept_call"})
            self._call_state = "active"
            print(f"\n{GREEN}✅  accept_call sent to phone{RESET}")

        elif cmd == "r":
            await self._broadcast({"action": "reject_call"})
            self._call_state = "idle"
            self._caller = ""
            print(f"\n{RED}❌  reject_call sent to phone{RESET}")

        elif cmd == "h":
            await self._broadcast({"action": "hangup"})
            self._call_state = "idle"
            self._caller = ""
            print(f"\n{YELLOW}📵  hangup sent to phone{RESET}")

        elif cmd.startswith("d "):
            number = cmd[2:].strip()
            if number:
                await self._broadcast({"action": "dial", "number": number})
                print(f"\n{CYAN}📤  Dialing {number} via phone…{RESET}")
            else:
                print("Usage:  d <number>   e.g.  d +911234567890")

        elif cmd.startswith("s "):
            route_arg = cmd[2:].strip()
            routes = {
                "l": "bluetooth",
                "e": "earpiece",
                "s": "speaker"
            }
            if route_arg in routes:
                route_name = routes[route_arg]
                await self._broadcast({"action": "set_audio_route", "route": route_name})
                print(f"\n{CYAN}🔊  Requested audio route: {route_name}{RESET}")
            else:
                print("Usage:  s l (laptop) | s e (earpiece) | s s (speaker)")

        else:
            print(f"Unknown command '{cmd}' — valid: a r h  d <num>  s <l|e|s>  q")

        self._print_prompt()

    # ── Helpers ───────────────────────────────────────────────────────────────

    async def _broadcast(self, payload: dict) -> None:
        clients = list(self._manager._clients)
        if not clients:
            print(f"{YELLOW}⚠️  No phones connected.{RESET}")
            return
        msg = json.dumps(payload)
        await asyncio.gather(
            *[ws.send(msg) for ws in clients],
            return_exceptions=True,
        )

    def _print_prompt(self) -> None:
        state_map = {
            "idle":    f"{CYAN}idle{RESET}",
            "ringing": f"{RED}ringing  →  a=answer  r=reject{RESET}",
            "active":  f"{GREEN}in call  →  h=hangup{RESET}",
        }
        label   = state_map.get(self._call_state, "")
        n       = len(self._manager._clients)
        phones  = f"{GREEN}{n} phone(s){RESET}" if n else f"{RED}no phones{RESET}"
        print(f"\n{BOLD}PhoneLink{RESET} [{label}] ({phones})  d <num>=dial  s <l|e|s>=audio  q=quit")
        print(">>> ", end="", flush=True)

    def _print_banner(self, port: int) -> None:
        print(f"\n{BOLD}{CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{RESET}")
        print(f"     🔗  {BOLD}PhoneLink{RESET} — Interactive Call Bridge")
        print(f"{CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{RESET}")
        print(f"  Host : {config.HOST}")
        print(f"  Port : {port}")
        print(f"\n  Commands (type and press Enter):")
        print(f"    {BOLD}a{RESET}          → Answer ringing call on phone")
        print(f"    {BOLD}r{RESET}          → Reject ringing call")
        print(f"    {BOLD}d <number>{RESET} → Dial a number from phone")
        print(f"    {BOLD}h{RESET}          → Hang up active call")
        print(f"    {BOLD}s l{RESET}        → Route audio to Laptop (Bluetooth)")
        print(f"    {BOLD}s e{RESET}        → Route audio to Earpiece")
        print(f"    {BOLD}s s{RESET}        → Route audio to phone Speaker")
        print(f"    {BOLD}q{RESET}          → Quit server")
        print(f"{BOLD}{CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{RESET}\n")
