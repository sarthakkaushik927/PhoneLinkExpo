/**
 * src/components/bridge/StatusCard.styles.js
 * ============================================
 * Styles isolated to the StatusCard component.
 * All colour values come from the COLORS token map.
 */

import { StyleSheet } from 'react-native';
import COLORS from '../../constants/colors';

export default StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     COLORS.border,
    padding:         20,
    marginHorizontal: 16,
    marginBottom:    8,
    // Shadow (iOS)
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.4,
    shadowRadius:    8,
    // Shadow (Android)
    elevation:       8,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   12,
  },

  title: {
    color:         COLORS.textPrimary,
    fontSize:      16,
    fontWeight:    '700',
    letterSpacing: 0.3,
  },

  badge: {
    flexDirection:   'row',
    alignItems:      'center',
    borderWidth:     1,
    borderRadius:    20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap:             4,
  },

  badgeIcon: { fontSize: 10, marginRight: 2 },
  badgeText: { fontSize: 12, fontWeight: '600' },

  // ── Divider ───────────────────────────────────────────────────────────────
  divider: {
    height:          1,
    backgroundColor: COLORS.border,
    marginBottom:    12,
  },

  // ── Server URL row ────────────────────────────────────────────────────────
  row: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   16,
  },

  rowLabel: {
    color:    COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },

  rowValue: {
    color:      COLORS.blue,
    fontSize:   13,
    fontFamily: 'monospace',
    maxWidth:   '70%',
  },

  // ── Command section ───────────────────────────────────────────────────────
  commandSection: { marginBottom: 14 },

  sectionLabel: {
    color:         COLORS.textSecondary,
    fontSize:      11,
    fontWeight:    '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom:  8,
  },

  commandBubble: {
    backgroundColor: COLORS.background,
    borderRadius:    10,
    borderWidth:     1,
    borderColor:     COLORS.accent,
    padding:         12,
  },

  commandText: {
    color:      COLORS.connected,
    fontFamily: 'monospace',
    fontSize:   14,
    fontWeight: '600',
  },

  emptyBubble: {
    backgroundColor: COLORS.background,
    borderRadius:    10,
    borderWidth:     1,
    borderColor:     COLORS.border,
    padding:         12,
    alignItems:      'center',
  },

  emptyText: {
    color:     COLORS.textSecondary,
    fontSize:  13,
    fontStyle: 'italic',
  },

  // ── Hint footer ───────────────────────────────────────────────────────────
  hint: {
    color:     COLORS.textMuted,
    fontSize:  11,
    textAlign: 'center',
    marginTop: 4,
  },
});
