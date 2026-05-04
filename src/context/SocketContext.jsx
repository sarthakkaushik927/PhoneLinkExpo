/**
 * src/context/SocketContext.jsx
 * ==============================
 * React Context that owns the WebSocket state for the entire application.
 *
 * What it provides:
 *   - `status`      — 'Disconnected' | 'Connecting' | 'Connected'
 *   - `lastCommand` — last parsed JSON payload received from the server
 *   - `serverIp`    — current stored server IP
 *   - `serverPort`  — current stored server port
 *   - `saveConfig(ip, port)` — persist new IP/port, auto-reconnects
 *   - `connect()`   — opens the WebSocket using stored IP
 *   - `disconnect()` — closes cleanly
 *   - `sendMessage(payload)` — sends JSON; returns bool
 *   - `simulateIncomingCall()` — helper for manual test button
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import socketClient from '../services/socket';
import discoveryService from '../services/discovery';
import { useServerConfig } from '../hooks/useServerConfig';

/** @enum {string} */
export const CONNECTION_STATUS = Object.freeze({
  DISCONNECTED: 'Disconnected',
  CONNECTING:   'Connecting',
  CONNECTED:    'Connected',
});

const SocketContext = createContext(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function SocketProvider({ children }) {
  const [status, setStatus]           = useState(CONNECTION_STATUS.DISCONNECTED);
  const [lastCommand, setLastCommand] = useState(null);
  const [isDiscovering, setIsDiscovering] = useState(false);

  const { serverIp, serverPort, wsUrl, saveConfig, loading } = useServerConfig();

  // Wire up SocketClient listeners once on mount; remove them on unmount.
  useEffect(() => {
    const handleOpen    = () => setStatus(CONNECTION_STATUS.CONNECTED);
    const handleMessage = payload => setLastCommand(payload);
    const handleError   = () => setStatus(CONNECTION_STATUS.DISCONNECTED);
    const handleClose   = () => setStatus(CONNECTION_STATUS.DISCONNECTED);

    socketClient
      .on('open',    handleOpen)
      .on('message', handleMessage)
      .on('error',   handleError)
      .on('close',   handleClose);

    return () => {
      socketClient
        .off('open',    handleOpen)
        .off('message', handleMessage)
        .off('error',   handleError)
        .off('close',   handleClose);
      socketClient.disconnect();
    };
  }, []); // Empty deps — intentional; runs once per Provider mount.

  // UDP Auto-Discovery logic
  useEffect(() => {
    setIsDiscovering(true);
    discoveryService.startListening();

    const onDiscover = (ip, port) => {
      console.log(`[Discovery] Found server at ${ip}:${port}`);
      discoveryService.stopListening();
      setIsDiscovering(false);

      // Only save the discovered IP if user has NOT manually configured one.
      // If serverIp is already set (from AsyncStorage), just connect to the
      // saved IP — do NOT overwrite it with the auto-discovered one.
      if (!serverIp) {
        saveConfig(ip, String(port)).then(() => {
          socketClient.connect(`ws://${ip}:${port}`);
          setStatus(CONNECTION_STATUS.CONNECTING);
        });
      } else {
        console.log(`[Discovery] Manual IP already set (${serverIp}), skipping override.`);
      }
    };

    discoveryService.onDiscover(onDiscover);

    return () => {
      discoveryService.offDiscover(onDiscover);
      discoveryService.stopListening();
      setIsDiscovering(false);
    };
  }, [saveConfig, serverIp]);

  const connect = useCallback(() => {
    if (!wsUrl) return; // No IP configured yet
    setStatus(CONNECTION_STATUS.CONNECTING);
    socketClient.connect(wsUrl);
  }, [wsUrl]);

  const disconnect = useCallback(() => {
    socketClient.disconnect();
    setStatus(CONNECTION_STATUS.DISCONNECTED);
  }, []);

  const sendMessage = useCallback(payload => socketClient.send(payload), []);

  /** Helper used by the manual test button on HomeScreen */
  const simulateIncomingCall = useCallback(() => {
    return socketClient.send({
      event:  'incoming_call',
      caller: '+91 98765 43210',
    });
  }, []);

  const value = {
    status,
    lastCommand,
    serverIp,
    serverPort,
    wsUrl,
    configLoading: loading,
    isDiscovering,
    saveConfig,
    connect,
    disconnect,
    sendMessage,
    simulateIncomingCall,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

// ── Internal hook ─────────────────────────────────────────────────────────────

/**
 * Raw context accessor. Prefer `useSocket` from `hooks/useSocket.js` in
 * components — it adds derived booleans and domain-specific actions.
 *
 * @throws If used outside a `<SocketProvider>`.
 */
export function useSocketContext() {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error('useSocketContext must be used inside a <SocketProvider>.');
  }
  return ctx;
}
