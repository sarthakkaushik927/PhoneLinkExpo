/**
 * src/services/socket/SocketClient.js
 * =====================================
 * A class-based WebSocket client implementing a lightweight observer pattern.
 *
 * Responsibilities:
 *   - Manage a single WebSocket connection lifecycle (connect / disconnect).
 *   - Emit typed events ('open', 'message', 'error', 'close') to registered listeners.
 *   - Serialize outgoing payloads to JSON.
 *   - Parse and validate incoming JSON messages before emitting them.
 *
 * Design notes:
 *   - Exported as a class so it can be unit-tested by mocking WebSocket.
 *   - A pre-built singleton is exported from `./index.js` for app-wide use.
 *   - Observer (`.on` / `.off`) pattern instead of callbacks keeps the API
 *     composable and avoids prop-drilling listener references.
 */


/**
 * Maps to the native WebSocket.readyState numeric values.
 * @enum {number}
 */
export const ReadyState = Object.freeze({
  CONNECTING:    0,
  OPEN:          1,
  CLOSING:       2,
  CLOSED:        3,
  UNINITIALIZED: -1, // No socket has been created yet.
});

/** @typedef {'open' | 'message' | 'error' | 'close'} SocketEvent */

class SocketClient {
  constructor() {
    /** @type {WebSocket | null} */
    this._socket = null;

    /** @type {Record<SocketEvent, Function[]>} */
    this._listeners = {
      open:    [],
      message: [],
      error:   [],
      close:   [],
    };
  }

  // ── Observer API ──────────────────────────────────────────────────────────

  /**
   * Register a listener for a socket lifecycle event.
   *
   * @param {SocketEvent} event
   * @param {Function}    callback
   * @returns {SocketClient} `this` — supports chaining.
   */
  on(event, callback) {
    if (Array.isArray(this._listeners[event])) {
      this._listeners[event].push(callback);
    }
    return this;
  }

  /**
   * Remove a previously registered listener.
   *
   * @param {SocketEvent} event
   * @param {Function}    callback  Must be the same reference passed to `.on()`.
   * @returns {SocketClient} `this` — supports chaining.
   */
  off(event, callback) {
    if (Array.isArray(this._listeners[event])) {
      this._listeners[event] = this._listeners[event].filter(fn => fn !== callback);
    }
    return this;
  }

  /** @private */
  _emit(event, ...args) {
    (this._listeners[event] || []).forEach(fn => {
      try {
        fn(...args);
      } catch (err) {
        console.error(`[SocketClient] Listener threw on "${event}":`, err);
      }
    });
  }

  // ── Connection lifecycle ──────────────────────────────────────────────────

  /**
   * Open a WebSocket connection to the configured server.
   * Idempotent — calling this while already OPEN is a no-op.
   */
  /**
   * @param {string} [url] Optional dynamic WebSocket URL.
   *   Overrides the default compiled-in WS_URL from server.config.js.
   */
  connect(url) {
    if (this._socket && this._socket.readyState === ReadyState.OPEN) {
      console.warn('[SocketClient] Already connected — ignoring connect().');
      return;
    }

    if (!url) {
      console.warn('[SocketClient] connect() called with no URL — ignoring. Wait for auto-discovery or set IP in Settings.');
      return;
    }

    const target = url;
    console.log(`[SocketClient] Connecting to ${target} …`);
    this._socket = new WebSocket(target);

    this._socket.onopen = e => {
      console.log('[SocketClient] ✅ Connected.');
      this._emit('open', e);
    };

    this._socket.onmessage = e => {
      try {
        const payload = JSON.parse(e.data);
        console.log('[SocketClient] 📨 Message received:', payload);
        this._emit('message', payload);
      } catch (err) {
        console.error('[SocketClient] Failed to parse incoming message:', e.data, err);
      }
    };

    this._socket.onerror = e => {
      console.error('[SocketClient] ❌ Error:', e.message ?? e);
      this._emit('error', e);
    };

    this._socket.onclose = e => {
      console.log(
        `[SocketClient] 🔌 Closed (code: ${e.code}, clean: ${e.wasClean})`
      );
      this._socket = null;
      this._emit('close', e);
    };
  }

  /**
   * Send a JSON-serialisable object to the server.
   *
   * @param {object} payload
   * @returns {boolean} `true` if sent successfully; `false` if socket is not open.
   */
  send(payload) {
    if (!this._socket || this._socket.readyState !== ReadyState.OPEN) {
      console.warn('[SocketClient] Cannot send — socket is not open.');
      return false;
    }
    try {
      this._socket.send(JSON.stringify(payload));
      console.log('[SocketClient] 📤 Sent:', payload);
      return true;
    } catch (err) {
      console.error('[SocketClient] Send failed:', err);
      return false;
    }
  }

  /**
   * Close the WebSocket with a clean close frame (code 1000).
   */
  disconnect() {
    if (this._socket) {
      console.log('[SocketClient] Disconnecting …');
      this._socket.close(1000, 'Client initiated disconnect');
      this._socket = null;
    }
  }

  // ── Computed properties ───────────────────────────────────────────────────

  /** @returns {number} Current readyState, or -1 if no socket exists. */
  get readyState() {
    return this._socket ? this._socket.readyState : ReadyState.UNINITIALIZED;
  }

  /** @returns {boolean} */
  get isOpen() {
    return this.readyState === ReadyState.OPEN;
  }
}

export default SocketClient;
