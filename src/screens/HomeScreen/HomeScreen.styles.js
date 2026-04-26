/**
 * src/screens/HomeScreen/HomeScreen.styles.js
 * =============================================
 * StyleSheet for HomeScreen layout only.
 * Component-level styles live alongside their component files.
 */

import { StyleSheet } from 'react-native';
import COLORS from '../../constants/colors';

export default StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    paddingTop: 16,
    paddingBottom: 48,
  },

  controlRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
  },

  flex1: {
    flex: 1,
  },

  callBtn: {
    marginHorizontal: 16,
    marginTop: 12,
  },
});
