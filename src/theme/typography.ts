/**
 * Typography scale and text style presets for the SpotIt app.
 */
import { TextStyle } from 'react-native';

// ── Font sizes ──────────────────────────────────────────────────────────
export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// ── Font weights (RN expects string literals) ───────────────────────────
export const fontWeight = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semibold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
};

// ── Line-height multipliers ─────────────────────────────────────────────
export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

// ── Presets ─────────────────────────────────────────────────────────────
export const textPresets: Record<string, TextStyle> = {
  h1: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    lineHeight: fontSize.xxxl * lineHeight.tight,
  },
  h2: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    lineHeight: fontSize.xxl * lineHeight.tight,
  },
  h3: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.xl * lineHeight.tight,
  },
  body: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.lg * lineHeight.normal,
  },
  bodySmall: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.md * lineHeight.normal,
  },
  caption: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.sm * lineHeight.normal,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.sm * lineHeight.normal,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
};
