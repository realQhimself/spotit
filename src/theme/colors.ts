/**
 * Color constants for the SpotIt app.
 *
 * Indigo-based palette with semantic tokens for consistent theming.
 */

export const colors = {
  // Primary brand
  primary: '#4F46E5',
  primaryLight: '#818CF8',
  primaryDark: '#3730A3',

  // Backgrounds
  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceSecondary: '#F3F4F6',

  // Text
  text: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',

  // Borders
  border: '#E5E7EB',
  borderLight: '#F3F4F6',

  // Overlays
  overlay: 'rgba(0,0,0,0.5)',

  // Detection / ML
  detection: '#22C55E',
} as const;

export type ColorToken = keyof typeof colors;
