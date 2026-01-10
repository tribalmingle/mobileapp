import { colors, gradients, spacing, typography, borderRadius, shadows, theme } from './theme/theme';

export const designTokens = {
  colors,
  gradients,
  spacing,
  typography,
  borderRadius,
  shadows,
  components: theme.components,
};

export const routes = {
  auth: {
    splash: '/(auth)/splash',
    welcome: '/(auth)/welcome',
    signup: '/(auth)/signup',
    login: '/(auth)/login',
    otpVerification: '/(auth)/otp-verification',
    passwordCreation: '/(auth)/password-creation',
    resetPassword: '/(auth)/reset-password',
    forgotPassword: '/(auth)/forgot-password',
    signupSuccess: '/(auth)/signup-success',
  },
  setup: {
    index: '/(setup)',
    steps: Array.from({ length: 13 }, (_, index) => `/(setup)/step${index + 1}`),
  },
  tabs: {
    home: '/(tabs)/home',
    discover: '/(tabs)/discover',
    matches: '/(tabs)/matches',
    chat: '/(tabs)/chat',
    profile: '/(tabs)/profile',
  },
};

export const layout = {
  screenPadding: spacing.screenPadding,
  cardPadding: spacing.cardPadding,
  cardPaddingLarge: spacing.cardPaddingLarge,
};
