/**
 * src/components/bridge/StatusCard.jsx
 * ======================================
 * Displays the current connection status and the last command received
 * from the Python desktop server.
 *
 * Props:
 *   connectionStatus {string}        'Disconnected' | 'Connecting' | 'Connected'
 *   lastCommand      {object | null} Last parsed JSON payload from server.
 *   serverIp         {string}        IP address shown in the server URL row.
 */

import React from 'react';
import { View, Text } from 'react-native';
import styles from './StatusCard.styles';
import COLORS from '../../constants/colors';

/** Visual metadata keyed by connection status string. */
const STATUS_META = {
  Connected:    { icon: '●', color: COLORS.connected },
  Connecting:   { icon: '◌', color: COLORS.connecting },
  Disconnected: { icon: '○', color: COLORS.disconnected },
};

/** Human-readable command label. Extend this for future server actions. */
function formatCommand(command) {
  if (!command) return null;
  if (command.action === 'accept_call') return '📞  Call Accepted by Desktop';
  return JSON.stringify(command, null, 2);
}

export default function StatusCard({
  connectionStatus = 'Disconnected',
  lastCommand      = null,
  serverIp         = '',
}) {
  const meta         = STATUS_META[connectionStatus] ?? STATUS_META.Disconnected;
  const formattedCmd = formatCommand(lastCommand);

  return (
    <View style={styles.card}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.title}>🖥  Desktop Bridge</Text>
        <View style={[styles.badge, { borderColor: meta.color }]}>
          <Text style={[styles.badgeIcon, { color: meta.color }]}>{meta.icon}</Text>
          <Text style={[styles.badgeText, { color: meta.color }]}>
            {connectionStatus}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* ── Server URL row ──────────────────────────────────────────── */}
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Server</Text>
        <Text style={styles.rowValue} numberOfLines={1}>
          {serverIp ? `ws://${serverIp}:8765` : '—'}
        </Text>
      </View>

      {/* ── Last command ────────────────────────────────────────────── */}
      <View style={styles.commandSection}>
        <Text style={styles.sectionLabel}>Last Command from Server</Text>

        {formattedCmd ? (
          <View style={styles.commandBubble}>
            <Text style={styles.commandText}>{formattedCmd}</Text>
          </View>
        ) : (
          <View style={styles.emptyBubble}>
            <Text style={styles.emptyText}>No command received yet.</Text>
          </View>
        )}
      </View>

      <Text style={styles.hint}>
        All communication happens over your local Wi-Fi (LAN).
      </Text>
    </View>
  );
}
