export const colors = {
  primary: '#5B2E91',
  primaryLight: '#7B4FB8',
  primaryDark: '#3D1E61',
  secondary: '#D4AF37',
  secondaryLight: '#E6C968',
  secondaryDark: '#B8951E',
  accent: '#B8951E',
  sunset: '#FF7043',
  background: '#0A0A0A',
  surface: '#1a0a2e',
  elevated: '#1f1233',
  text: {
    primary: '#F5F5DC',
    secondary: '#B0B0B0',
    tertiary: '#8B7355',
  },
  input: {
    background: '#FFFFFF',
    border: 'rgba(212, 175, 55, 0.2)',
    borderFocused: 'rgba(212, 175, 55, 0.6)',
    text: '#000000',
    placeholder: '#8B8B8B',
  },
  orange: {
    primary: '#F97316',
    dark: '#EA580C',
  },
  neutral: {
    gray: {
      400: '#9CA3AF',
      500: '#6B7280',
      700: '#374151',
    },
  },
  glass: {
    light: 'rgba(255,255,255,0.14)',
    medium: 'rgba(255,255,255,0.08)',
    dark: 'rgba(0,0,0,0.35)',
    stroke: 'rgba(255,255,255,0.18)',
  },
  gradient: {
    primary: ['#5B2E91', '#D4AF37'],
  },
  border: 'rgba(212, 175, 55, 0.2)',
  borderStrong: 'rgba(212, 175, 55, 0.4)',
  glowGold: 'rgba(212, 175, 55, 0.4)',
  glowGoldStrong: 'rgba(212, 175, 55, 0.6)',
  error: '#F87171',
  success: '#34D399',
  warning: '#FBBF24',
  white: '#FFFFFF',
  black: '#000000',
  dark: {
    navy: '#0A0A0A',
    purple: '#1a0a2e',
    bg: '#0A0A0A',
  },
  purple: {
    400: '#7B4FB8',
    500: '#5B2E91',
    600: '#3D1E61',
  },
};

export const gradients = {
  hero: {
    colors: ['#0A0A0A', '#1a0a2e'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  purple: {
    colors: ['#5B2E91', '#3D1E61'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  gold: {
    colors: ['#D4AF37', '#B8951E'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  royal: {
    colors: ['#0A0A0A', '#5B2E91', '#D4AF37'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
    locations: [0, 0.5, 1],
  },
  deepMystic: {
    colors: ['#3D1E61', '#5B2E91'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  '2xl': 48,
  screenPadding: 20,
  cardPadding: 16,
  cardPaddingLarge: 20,
  buttonGap: 12,
  inputPadding: 14,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: 'normal' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: 'normal' as const,
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    fontWeight: 'normal' as const,
    lineHeight: 16,
  },
  base: {
    fontSize: 16,
    fontWeight: 'normal' as const,
    lineHeight: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
  xl: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  '2xl': {
    fontSize: 24,
    fontWeight: 'bold' as const,
    lineHeight: 32,
  },
  '6xl': {
    fontSize: 60,
    fontWeight: 'bold' as const,
    lineHeight: 72,
  },
  xxl: {
    fontSize: 48,
    fontWeight: 'bold' as const,
    lineHeight: 56,
  },
  components: {
    button: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
    input: {
      fontSize: 16,
      fontWeight: 'normal' as const,
      lineHeight: 24,
    },
  },
  fontFamily: {
    display: 'System',
    sans: 'System',
    mono: 'System',
  },
  styles: {
    h1: {
      fontSize: 32,
      fontWeight: 'bold' as const,
      lineHeight: 40,
    },
    h2: {
      fontSize: 24,
      fontWeight: 'bold' as const,
      lineHeight: 32,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
    },
    body: {
      fontSize: 16,
      fontWeight: 'normal' as const,
      lineHeight: 24,
    },
    bodySmall: {
      fontSize: 14,
      fontWeight: 'normal' as const,
      lineHeight: 20,
    },
    caption: {
      fontSize: 14,
      fontWeight: 'normal' as const,
      lineHeight: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '600' as const,
      lineHeight: 20,
    },
    button: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
    xl: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
    },
    '2xl': {
      fontSize: 24,
      fontWeight: 'bold' as const,
      lineHeight: 32,
    },
    xxl: {
      fontSize: 48,
      fontWeight: 'bold' as const,
      lineHeight: 56,
    },
    '6xl': {
      fontSize: 60,
      fontWeight: 'bold' as const,
      lineHeight: 72,
    },
  },
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  input: 12,
  button: 12,
   card: 16,
  full: 9999,
};

export const shadows = {
  xs: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 1.5,
    elevation: 1,
  },
  sm: {
    shadowColor: '#5B2E91',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#3D1E61',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  lg: {
    shadowColor: '#B8951E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  glass: {
    shadowColor: 'rgba(0, 0, 0, 0.35)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 12,
  },
};

export const theme = {
  colors,
  gradients,
  spacing,
  typography,
  borderRadius,
  shadows,
  components: {
    button: {
      height: {
        sm: 40,
        md: 48,
        lg: 56,
      },
    },
    input: {
      height: 52,
    },
  },
};

export default theme;
