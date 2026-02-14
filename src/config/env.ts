const normalizeApiBaseUrl = (value?: string) => {
  if (!value) return 'https://tribalmingle.com/api';
  // Guarantee trailing /api so misconfigured envs do not hit the wrong host.
  const trimmed = value.replace(/\/$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};


export const env = {
  apiBaseUrl: normalizeApiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL),
  uploadBaseUrl: process.env.EXPO_PUBLIC_UPLOAD_BASE_URL,
  appEnv: process.env.EXPO_PUBLIC_APP_ENV || 'production',
  revenueCatIosApiKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || 'appl_xEpgwlwnLYwRlCIsMPVGcbAuDZg',
  revenueCatAndroidApiKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || 'goog_EMdyjKnlxkiEfxCqIamWZJOcIgA',
  revenueCatPremiumEntitlement: process.env.EXPO_PUBLIC_REVENUECAT_PREMIUM_ENTITLEMENT || 'Tribalmingle Pro',
  
  // Analytics providers
  analyticsProvider: process.env.EXPO_PUBLIC_ANALYTICS_PROVIDER as 'segment' | 'posthog' | 'mixpanel' | 'console' | undefined,
  segmentWriteKey: process.env.EXPO_PUBLIC_SEGMENT_WRITE_KEY,
  posthogApiKey: process.env.EXPO_PUBLIC_POSTHOG_API_KEY,
  posthogHost: process.env.EXPO_PUBLIC_POSTHOG_HOST,
  mixpanelToken: process.env.EXPO_PUBLIC_MIXPANEL_TOKEN,
};

export const isStaging = env.appEnv !== 'production';
export const isProduction = env.appEnv === 'production';
