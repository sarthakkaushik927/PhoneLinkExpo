/**
 * src/components/common/ActivityLog.jsx
 * =======================================
 * Displays a rolling list of timestamped log entries.
 *
 * Props:
 *   lines {string[]}  Log entries from `useActivityLog`, newest-first.
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import COLORS from '../../constants/colors';

export default function ActivityLog({ lines = [] }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>📋  Activity Log</Text>

      {lines.length === 0 ? (
        <Text style={styles.empty}>No activity yet. Connect to start.</Text>
      ) : (
        lines.map((line, i) => (
          <Text key={i} style={styles.line} numberOfLines={2}>
            {line}
          </Text>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop:        16,
    backgroundColor:  COLORS.surface,
    borderRadius:     12,
    borderWidth:      1,
    borderColor:      COLORS.border,
    padding:          16,
  },

  title: {
    color:          COLORS.textSecondary,
    fontWeight:     '700',
    fontSize:       11,
    textTransform:  'uppercase',
    letterSpacing:  0.8,
    marginBottom:   10,
  },

  empty: {
    color:         COLORS.textMuted,
    fontStyle:     'italic',
    fontSize:      13,
    textAlign:     'center',
    paddingVertical: 8,
  },

  line: {
    color:       '#C9D1D9',
    fontFamily:  Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize:    12,
    lineHeight:  18,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
});
