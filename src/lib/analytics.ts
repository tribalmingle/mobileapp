type AnalyticsEvent = {
  name: string;
  props?: Record<string, any>;
};

let enabled = true;
let initialized = false;
let userId: string | undefined;
let traits: Record<string, any> | undefined;
let flushHandler: ((payload: { name: string; props?: Record<string, any> }) => void) | undefined;

export const initAnalytics = () => {
  if (initialized) return;
  initialized = true;
  enabled = true;
  logInternal('analytics_init', {});
};

export const identifyUser = (id?: string, userTraits?: Record<string, any>) => {
  userId = id;
  traits = userTraits;
  logInternal('identify', { userId, traits });
};

export const setAnalyticsEnabled = (value: boolean) => {
  enabled = value;
};

export const setAnalyticsHandler = (handler: (payload: { name: string; props?: Record<string, any> }) => void) => {
  flushHandler = handler;
};

export const trackEvent = (name: string, props?: Record<string, any>) => {
  if (!enabled) return;
  logInternal(name, props);
};

export const trackScreen = (name: string, props?: Record<string, any>) => trackEvent(`screen_${name}`, props);

export const captureError = (error: unknown, context?: Record<string, any>) => {
  if (!enabled) return;
  const payload = {
    message: (error as any)?.message || String(error),
    stack: (error as any)?.stack,
    ...context,
  };
  logInternal('error', payload);
};

const logInternal = (name: string, props?: Record<string, any>) => {
  const timestamp = new Date().toISOString();
  const payload = { userId, ...(traits ? { traits } : {}), ...(props || {}) };
  if (flushHandler) {
    flushHandler({ name, props: payload });
    return;
  }
  // Fallback to console until wired to a provider
  console.log('[analytics]', timestamp, name, payload);
};
