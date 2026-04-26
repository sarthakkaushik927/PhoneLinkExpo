import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

// ─── Colour tokens ────────────────────────────────────────────────────────────
const COLORS = {
  background: '#0D1117',
  surface: '#161B22',
  border: '#30363D',
  textPrimary: '#E6EDF3',
  textSecondary: '#8B949E',
  accent: '#238636',
  accentAlt: '#1F6FEB',
  danger: '#DA3633',
  warning: '#D29922',
  connected: '#3FB950',
  disconnected: '#8B949E',
  connecting: '#D29922',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getStatusColor(status) {
  switch (status) {
    case 'Connected':    return COLORS.connected;
    case 'Connecting':   return COLORS.connecting;
    default:             return COLORS.disconnected;
  }
}

function getStatusIcon(status) {
  switch (status) {
    case 'Connected':    return '●';
    case 'Connecting':   return '◌';
    default:             return '○';
  }
}

function formatCommand(command) {
  if (!command) return null;
  if (command.action === 'accept_call') return '📞  Call Accepted by Desktop';
  return JSON.stringify(command, null, 2);
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * StatusCard
 *
 * Props:
 *  - connectionStatus {string}  'Disconnected' | 'Connecting' | 'Connected'
 *  - lastCommand      {object|null}  Last JSON payload received from the server.
 *  - serverIp         {string}  IP address of the desktop server.
 */
const StatusCard = ({ connectionStatus = 'Disconnected', lastCommand = null, serverIp = '' }) => {
  const statusColor = getStatusColor(connectionStatus);
  const statusIcon  = getStatusIcon(connectionStatus);
  const formattedCmd = formatCommand(lastCommand);

  return (
    <View style={styles.card}>
      {/* ── Header ── */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>🖥  Desktop Bridge</Text>
        <View style={[styles.badge, { borderColor: statusColor }]}>
          <Text style={[styles.badgeIcon, { color: statusColor }]}>{statusIcon}</Text>
          <Text style={[styles.badgeText, { color: statusColor }]}>{connectionStatus}</Text>
        </View>
      </View>

      {/* ── Divider ── */}
      <View style={styles.divider} />

      {/* ── Server info row ── */}
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Server</Text>
        <Text style={styles.infoValue} numberOfLines={1}>
          {serverIp ? `ws://${serverIp}:8765` : '—'}
        </Text>
      </View>

      {/* ── Last command ── */}
      <View style={styles.commandContainer}>
        <Text style={styles.commandLabel}>Last Command from Server</Text>
        {formattedCmd ? (
          <View style={styles.commandBubble}>
            <Text style={styles.commandText}>{formattedCmd}</Text>
          </View>
        ) : (
          <View style={styles.commandEmpty}>
            <Text style={styles.commandEmptyText}>No command received yet.</Text>
          </View>
        )}
      </View>

      {/* ── Footer hint ── */}
      <Text style={styles.hint}>
        All communication happens over your local Wi-Fi (LAN).
      </Text>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },

  // Header
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  badgeIcon: {
    fontSize: 10,
    marginRight: 3,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 12,
  },

  // Info row
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  infoValue: {
    color: COLORS.accentAlt,
    fontSize: 13,
    fontFamily: 'monospace',
    maxWidth: '70%',
  },

  // Command
  commandContainer: {
    marginBottom: 14,
  },
  commandLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  commandBubble: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.accent,
    padding: 12,
  },
  commandText: {
    color: COLORS.connected,
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '600',
  },
  commandEmpty: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    alignItems: 'center',
  },
  commandEmptyText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
  },

  // Hint
  hint: {
    color: COLORS.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
});

export default StatusCard;
