/**
 * src/hooks/useSocket.js
 * =======================
 * Public socket hook for use in screen and component files.
 *
 * Extends the raw SocketContext with:
 *   - Derived boolean flags (isConnected, isConnecting, isDisconnected)
 *     so components never compare against magic strings.
 *   - `simulateIncomingCall(caller?)` — a domain-specific convenience action.
 *
 * Usage:
 *     const { status, isConnected, simulateIncomingCall } = useSocket();
 */

import { useCallback } from 'react';

import { CONNECTION_STATUS, useSocketContext } from '../context/SocketContext';

/**
 * @returns {{
 *   status:               string,
 *   lastCommand:          object | null,
 *   isConnected:          boolean,
 *   isConnecting:         boolean,
 *   isDisconnected:       boolean,
 *   connect:              () => void,
 *   disconnect:           () => void,
 *   sendMessage:          (payload: object) => boolean,
 *   simulateIncomingCall: (caller?: string) => boolean,
 * }}
 */
export function useSocket() {
  const {
    status, lastCommand,
    serverIp, serverPort, wsUrl, saveConfig, configLoading, isDiscovering,
    connect, disconnect, sendMessage, simulateIncomingCall,
  } = useSocketContext();

  return {
    // Raw state
    status,
    lastCommand,
    // Server config
    serverIp,
    serverPort,
    wsUrl,
    saveConfig,
    configLoading,
    isDiscovering,
    // Derived booleans — avoids string comparisons leaking into UI
    isConnected:    status === CONNECTION_STATUS.CONNECTED,
    isConnecting:   status === CONNECTION_STATUS.CONNECTING,
    isDisconnected: status === CONNECTION_STATUS.DISCONNECTED,
    // Actions
    connect,
    disconnect,
    sendMessage,
    simulateIncomingCall,
  };
}
