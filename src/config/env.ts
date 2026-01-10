const normalizeApiBaseUrl = (value?: string) => {
  if (!value) return 'https://tribalmingle.com/api';
  // Guarantee trailing /api so misconfigured envs do not hit the wrong host.
  const trimmed = value.replace(/\/$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

export const env = {
  apiBaseUrl: normalizeApiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL),
  appEnv: process.env.EXPO_PUBLIC_APP_ENV || 'production',
};

export const isStaging = env.appEnv !== 'production';
export const isProduction = env.appEnv === 'production';
