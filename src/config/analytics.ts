// Placeholder to wire a real analytics provider (e.g., Segment/Sentry/Datadog).
// Implementers can replace sendEvent with provider SDK calls.
import { setAnalyticsHandler } from '@/lib/analytics';

type AnalyticsPayload = { name: string; props?: Record<string, any> };

const sendEvent = (payload: AnalyticsPayload) => {
  // TODO: swap with provider SDK, e.g., Segment.track or Sentry.captureMessage.
  // console.debug('[analytics dispatch]', payload);
};

export const configureAnalyticsProvider = () => {
  setAnalyticsHandler(sendEvent);
};
