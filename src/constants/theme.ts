// ============================================================
// RemindMeHere — Design System Tokens
// ============================================================

export const Colors = {
  // Backgrounds
  background: '#0A0E1A',
  surface: '#141B2D',
  surfaceElevated: '#1C2540',
  surfacePressed: '#243052',

  // Primary
  primary: '#4F8CFF',
  primaryDim: '#3A6FD8',
  primaryGlow: 'rgba(79, 140, 255, 0.2)',
  primaryGlowStrong: 'rgba(79, 140, 255, 0.35)',

  // Semantic
  success: '#00D68F',
  successDim: '#00B377',
  warning: '#FFB443',
  warningDim: '#E09A2F',
  danger: '#FF4757',
  dangerDim: '#D63644',

  // Text
  textPrimary: '#F0F4FF',
  textSecondary: '#8B95B0',
  textMuted: '#505A72',
  textInverse: '#0A0E1A',

  // Borders
  border: '#1E2845',
  borderLight: '#2A3558',

  // Misc
  overlay: 'rgba(10, 14, 26, 0.7)',
  shimmer: 'rgba(79, 140, 255, 0.08)',
} as const;

export const CategoryColors: Record<string, string> = {
  shopping: '#FF6B9D',
  work: '#4F8CFF',
  personal: '#A78BFA',
  health: '#00D68F',
  finance: '#FFB443',
  social: '#FF8A5C',
  general: '#8B95B0',
};

export const CategoryIcons: Record<string, string> = {
  shopping: 'cart-outline',
  work: 'briefcase-outline',
  personal: 'person-outline',
  health: 'heart-outline',
  finance: 'wallet-outline',
  social: 'people-outline',
  general: 'flag-outline',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 999,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: '#4F8CFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

export const RadiusOptions = [
  { label: '100m', value: 100 },
  { label: '150m', value: 150 },
  { label: '250m', value: 250 },
  { label: '500m', value: 500 },
  { label: '1 km', value: 1000 },
] as const;
