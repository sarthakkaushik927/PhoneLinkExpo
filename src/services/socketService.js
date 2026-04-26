// ============================================================
// socketService.js — WebSocket Service Layer
// ============================================================
// ⚠️  ACTION REQUIRED: Update SERVER_IP to your PC's IPv4 address.
//     Find it by running `ipconfig` (Windows) or `ip addr` (Linux)
//     on the machine running server/main.py.
//     Example: const SERVER_IP = '192.168.1.42';
// ============================================================
const SERVER_IP = '192.168.29.207'; // <-- CHANGE THIS
const SERVER_PORT = 8765;
const WS_URL = `ws://${SERVER_IP}:${SERVER_PORT}`;

let socket = null;

/**
 * Establish a WebSocket connection to the Python desktop server.
 *
 * @param {object} callbacks
 * @param {function} callbacks.onOpen         - Called when the connection opens.
 * @param {function} callbacks.onMessage      - Called with the parsed JSON payload on each message.
 * @param {function} callbacks.onError        - Called with the error event on connection error.
 * @param {function} callbacks.onClose        - Called with the close event when the connection closes.
 */
export function connect({ onOpen, onMessage, onError, onClose }) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    console.warn('[SocketService] Already connected. Skipping duplicate connect().');
    return;
  }

  console.log(`[SocketService] Connecting to ${WS_URL} …`);
  socket = new WebSocket(WS_URL);

  socket.onopen = (event) => {
    console.log('[SocketService] Connection established.');
    if (typeof onOpen === 'function') onOpen(event);
  };

  socket.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      console.log('[SocketService] Message received:', payload);
      if (typeof onMessage === 'function') onMessage(payload);
    } catch (err) {
      console.error('[SocketService] Failed to parse incoming message:', event.data, err);
    }
  };

  socket.onerror = (event) => {
    console.error('[SocketService] WebSocket error:', event);
    if (typeof onError === 'function') onError(event);
  };

  socket.onclose = (event) => {
    console.log(`[SocketService] Connection closed. Code: ${event.code}, Clean: ${event.wasClean}`);
    socket = null;
    if (typeof onClose === 'function') onClose(event);
  };
}

/**
 * Send a JSON-serialisable object to the server.
 *
 * @param {object} payload - The data to send.
 * @returns {boolean}      - True if sent successfully, false otherwise.
 */
export function sendMessage(payload) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.warn('[SocketService] Cannot send message — socket is not open.');
    return false;
  }

  try {
    const data = JSON.stringify(payload);
    socket.send(data);
    console.log('[SocketService] Message sent:', payload);
    return true;
  } catch (err) {
    console.error('[SocketService] Failed to serialize payload:', err);
    return false;
  }
}

/**
 * Cleanly close the WebSocket connection.
 */
export function disconnect() {
  if (socket) {
    console.log('[SocketService] Disconnecting …');
    socket.close(1000, 'Client initiated disconnect');
    socket = null;
  }
}

/**
 * Returns the current WebSocket ready-state, or -1 if no socket exists.
 */
export function getReadyState() {
  return socket ? socket.readyState : -1;
}
