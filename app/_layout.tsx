import { Stack, router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@/theme';
import { useEffect } from 'react';
import { configureNotificationHandling, requestAndRegisterPushToken, notificationResponseListener, notificationForegroundListener } from '@/config/notifications';
import { initAnalytics, trackEvent } from '@/lib/analytics';
import { configureAnalyticsProvider } from '@/config/analytics';
import { useScreenTracking } from '@/hooks/useScreenTracking';

export default function RootLayout() {
  useScreenTracking();

  useEffect(() => {
    initAnalytics();
    configureAnalyticsProvider();
    trackEvent('app_start');

    configureNotificationHandling();
    requestAndRegisterPushToken();

    const sub = notificationResponseListener((url) => {
      router.push(url);
    });
    const fg = notificationForegroundListener(() => {});
    return () => {
      sub.remove();
      fg.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
    </SafeAreaProvider>
  );
}
