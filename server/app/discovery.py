import socket
import json
import time
import threading

class DiscoveryService:
    """
    Periodically broadcasts the server's IP and Port over UDP
    so the mobile app can automatically discover and connect to it.
    """
    def __init__(self, port: int, broadcast_port: int = 8766):
        self.ws_port = port
        self.broadcast_port = broadcast_port
        self._running = False
        self._thread = None
        self._ip = self._get_local_ip()
        
    def _get_local_ip(self):
        try:
            # Create a dummy socket to find our actual local LAN IP
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except Exception:
            return "127.0.0.1"

    def _broadcast_loop(self):
        # Setup UDP socket for broadcasting
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        
        payload = json.dumps({
            "service": "PhoneLink",
            "ip": self._ip,
            "port": self.ws_port
        }).encode('utf-8')
        
        while self._running:
            try:
                # Broadcast to the entire local subnet
                sock.sendto(payload, ("255.255.255.255", self.broadcast_port))
            except Exception:
                pass
            time.sleep(2)  # Broadcast every 2 seconds
            
        sock.close()

    def start(self):
        if self._running:
            return
        self._running = True
        self._thread = threading.Thread(target=self._broadcast_loop, daemon=True)
        self._thread.start()

    def stop(self):
        self._running = False
        if self._thread:
            self._thread.join(timeout=1.0)
