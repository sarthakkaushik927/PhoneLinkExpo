/**
 * src/hooks/useActivityLog.js
 * ============================
 * Manages a rolling list of timestamped log entries for the in-app activity log.
 *
 * Features:
 *   - Newest entries prepended at index 0 (visible without scrolling).
 *   - Capped at MAX_LINES to prevent unbounded memory growth.
 *   - Stable `addLog` / `clearLog` references via `useCallback`.
 *
 * Usage:
 *     const { logLines, addLog, clearLog } = useActivityLog();
 *     addLog('✅ Connected to server');
 */

import { useState, useCallback } from 'react';

/** Maximum number of log lines retained in state. */
const MAX_LINES = 50;

/**
 * @returns {{
 *   logLines: string[],
 *   addLog:   (message: string) => void,
 *   clearLog: () => void,
 * }}
 */
export function useActivityLog() {
  const [logLines, setLogLines] = useState([]);

  const addLog = useCallback((message) => {
    const ts = new Date().toLocaleTimeString('en-US', {
      hour12:  false,
      hour:    '2-digit',
      minute:  '2-digit',
      second:  '2-digit',
    });
    setLogLines(prev =>
      [`[${ts}]  ${message}`, ...prev].slice(0, MAX_LINES)
    );
  }, []);

  const clearLog = useCallback(() => setLogLines([]), []);

  return { logLines, addLog, clearLog };
}
