/**
 * src/constants/colors.js
 * ========================
 * Design token palette for the Linux Phone Link dark-mode UI.
 *
 * Rules:
 *   - Import this file and reference tokens by name.
 *   - NEVER hard-code hex values inside components or stylesheets.
 *   - If you need a new colour, add it here first.
 */

/** @type {Readonly<Record<string, string>>} */
const COLORS = Object.freeze({
  // ── Backgrounds ──────────────────────────────────────────────────────────
  background:   '#0D1117', // GitHub-dark base
  surface:      '#161B22', // Card / elevated surface
  surfaceAlt:   '#1C2128', // Deeper inset surface

  // ── Borders ────────────────────────────────────────────────────────────────
  border:       '#30363D',
  borderHover:  '#484F58',

  // ── Typography ──────────────────────────────────────────────────────────────
  textPrimary:   '#E6EDF3',
  textSecondary: '#8B949E',
  textMuted:     '#6E7681',

  // ── Green accent ────────────────────────────────────────────────────────────
  accent:        '#238636',
  accentLight:   '#2EA043',
  accentDim:     '#0D2818',

  // ── Blue ────────────────────────────────────────────────────────────────────
  blue:          '#1F6FEB',
  blueDim:       '#0D1F3C',

  // ── Status indicators ───────────────────────────────────────────────────────
  connected:     '#3FB950',
  connecting:    '#D29922',
  disconnected:  '#6E7681',

  // ── Danger (red) ────────────────────────────────────────────────────────────
  danger:        '#DA3633',
  dangerDim:     '#4A1717',

  // ── Call action button ──────────────────────────────────────────────────────
  callGreen:        '#1A7F37',
  callGreenBorder:  '#238636',
  callGreenDim:     '#0D2818',

  // ── Warning (amber) ─────────────────────────────────────────────────────────
  warning:       '#D29922',
  warningDim:    '#2E2006',
});

export default COLORS;
