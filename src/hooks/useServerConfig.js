/**
 * src/hooks/useServerConfig.js
 * =============================
 * Persists the server IP and port to AsyncStorage so the user never has
 * to hardcode anything in source files.
 *
 * Usage:
 *   const { serverIp, serverPort, wsUrl, saveConfig, loading } = useServerConfig();
 */

import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_IP   = '@phonelink:serverIp';
const STORAGE_KEY_PORT = '@phonelink:serverPort';

const DEFAULT_IP   = '20.20.3.67'; // Your PC's IP — change if it changes
const DEFAULT_PORT = '8765';

export function useServerConfig() {
  const [serverIp,   setServerIp]   = useState(DEFAULT_IP);
  const [serverPort, setServerPort] = useState(DEFAULT_PORT);
  const [loading,    setLoading]    = useState(true);

  // Load persisted values on mount
  useEffect(() => {
    (async () => {
      try {
        const [ip, port] = await AsyncStorage.multiGet([STORAGE_KEY_IP, STORAGE_KEY_PORT]);
        // Use stored value, or fall back to DEFAULT_IP if never saved
        if (ip[1])   setServerIp(ip[1]);
        else         setServerIp(DEFAULT_IP);
        if (port[1]) setServerPort(port[1]);
        else         setServerPort(DEFAULT_PORT);
      } catch (err) {
        console.error('[useServerConfig] Failed to load config:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /** Persist a new IP + port pair. */
  const saveConfig = useCallback(async (ip, port = serverPort) => {
    const trimmedIp   = ip.trim();
    const trimmedPort = port.trim();
    try {
      await AsyncStorage.multiSet([
        [STORAGE_KEY_IP,   trimmedIp],
        [STORAGE_KEY_PORT, trimmedPort],
      ]);
      setServerIp(trimmedIp);
      setServerPort(trimmedPort);
      return true;
    } catch (err) {
      console.error('[useServerConfig] Failed to save config:', err);
      return false;
    }
  }, [serverPort]);

  const wsUrl = serverIp
    ? `ws://${serverIp}:${serverPort}`
    : null;

  return { serverIp, serverPort, wsUrl, saveConfig, loading };
}
