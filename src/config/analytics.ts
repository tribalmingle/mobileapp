// Analytics provider configuration - supports Segment, PostHog, Mixpanel, or custom adapters.
// Set ANALYTICS_PROVIDER in env to enable real tracking.
import { setAnalyticsHandler } from '@/lib/analytics';
import { env } from './env';

type AnalyticsPayload = { name: string; props?: Record<string, any> };

// Segment adapter
const segmentAdapter = (writeKey: string) => {
  // In production, install @segment/analytics-react-native and import Analytics
  // import Analytics from '@segment/analytics-react-native'
  // await Analytics.setup(writeKey, { trackApplicationLifecycleEvents: true })
  
  return (payload: AnalyticsPayload) => {
    // Analytics.track(payload.name, payload.props)
    console.debug('[Segment stub]', payload);
  };
};

// PostHog adapter
const posthogAdapter = (apiKey: string, host: string) => {
  // In production, install posthog-react-native and import PostHog
  // import PostHog from 'posthog-react-native'
  // const posthog = await PostHog.initAsync(apiKey, { host })
  
  return (payload: AnalyticsPayload) => {
    // posthog.capture(payload.name, payload.props)
    console.debug('[PostHog stub]', payload);
  };
};

// Mixpanel adapter  
const mixpanelAdapter = (token: string) => {
  // In production, install mixpanel-react-native and import Mixpanel
  // import { Mixpanel } from 'mixpanel-react-native'
  // const mixpanel = await Mixpanel.init(token)
  
  return (payload: AnalyticsPayload) => {
    // mixpanel.track(payload.name, payload.props)
    console.debug('[Mixpanel stub]', payload);
  };
};

// Console fallback for development
const consoleAdapter = () => (payload: AnalyticsPayload) => {
  console.debug('[Analytics]', payload.name, payload.props);
};

export const configureAnalyticsProvider = () => {
  const provider = env.analyticsProvider || 'console';
  
  let handler: ((payload: AnalyticsPayload) => void) | undefined;
  
  switch (provider) {
    case 'segment':
      if (env.segmentWriteKey) {
        handler = segmentAdapter(env.segmentWriteKey);
        console.log('[Analytics] Segment configured');
      } else {
        console.warn('[Analytics] Segment enabled but SEGMENT_WRITE_KEY missing, using console');
        handler = consoleAdapter();
      }
      break;
      
    case 'posthog':
      if (env.posthogApiKey && env.posthogHost) {
        handler = posthogAdapter(env.posthogApiKey, env.posthogHost);
        console.log('[Analytics] PostHog configured');
      } else {
        console.warn('[Analytics] PostHog enabled but keys missing, using console');
        handler = consoleAdapter();
      }
      break;
      
    case 'mixpanel':
      if (env.mixpanelToken) {
        handler = mixpanelAdapter(env.mixpanelToken);
        console.log('[Analytics] Mixpanel configured');
      } else {
        console.warn('[Analytics] Mixpanel enabled but MIXPANEL_TOKEN missing, using console');
        handler = consoleAdapter();
      }
      break;
      
    default:
      handler = consoleAdapter();
      console.log('[Analytics] Using console logger (dev mode)');
  }
  
  setAnalyticsHandler(handler);
};

