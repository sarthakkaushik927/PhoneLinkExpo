/**
 * src/components/common/AppButton.jsx
 * =====================================
 * Reusable, themed button supporting four visual variants.
 *
 * Props:
 *   label    {string}  Primary button text.
 *   sublabel {string?} Optional small descriptor shown below the label.
 *   onPress  {func}    Press handler.
 *   disabled {bool}    Renders at reduced opacity and blocks interaction.
 *   variant  {'primary' | 'danger' | 'call' | 'secondary'}
 *   style    {object?} Additional style overrides for the outer container.
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import COLORS from '../../constants/colors';

/** @type {Record<string, { background: string, border: string, text: string }>} */
const VARIANTS = {
  primary: {
    background: COLORS.accentDim,
    border:     COLORS.callGreenBorder,
    text:       COLORS.textPrimary,
  },
  danger: {
    background: COLORS.dangerDim,
    border:     COLORS.danger,
    text:       COLORS.textPrimary,
  },
  call: {
    background: COLORS.callGreen,
    border:     COLORS.callGreenBorder,
    text:       COLORS.textPrimary,
  },
  secondary: {
    background: COLORS.surface,
    border:     COLORS.border,
    text:       COLORS.textSecondary,
  },
};

export default function AppButton({
  label,
  sublabel,
  onPress,
  disabled = false,
  variant  = 'secondary',
  style,
}) {
  const v = VARIANTS[variant] ?? VARIANTS.secondary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
      style={[
        styles.button,
        { backgroundColor: v.background, borderColor: v.border },
        variant === 'call' && styles.callElevation,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.label, { color: v.text }]}>{label}</Text>
      {sublabel ? (
        <Text style={styles.sublabel}>{sublabel}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius:     12,
    borderWidth:      1,
    paddingVertical:  14,
    paddingHorizontal: 18,
    alignItems:       'center',
    justifyContent:   'center',
  },

  callElevation: {
    shadowColor:  COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation:    8,
  },

  disabled: {
    opacity: 0.4,
  },

  label: {
    fontSize:    15,
    fontWeight:  '700',
    letterSpacing: 0.2,
  },

  sublabel: {
    color:      COLORS.textSecondary,
    fontSize:   12,
    marginTop:  5,
    textAlign:  'center',
    lineHeight: 16,
  },
});
