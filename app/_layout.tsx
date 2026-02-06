import { Stack, router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@/theme';
import { useEffect } from 'react';
import { configureNotificationHandling, requestAndRegisterPushToken, notificationResponseListener, notificationForegroundListener } from '@/config/notifications';
import { initAnalytics, trackEvent } from '@/lib/analytics';
import { configureAnalyticsProvider } from '@/config/analytics';
import { useScreenTracking } from '@/hooks/useScreenTracking';
import { fetchNotifications } from '@/api/notifications';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';

export default function RootLayout() {
  useScreenTracking();
  const setNotifications = useNotificationStore((state) => state.setNotifications);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    initAnalytics();
    configureAnalyticsProvider();
    trackEvent('app_start');
  }, []);

  useEffect(() => {
    try {
      configureNotificationHandling();
    } catch (error) {
      console.warn('Notification handling setup failed', error);
    }

    const sub = notificationResponseListener((url) => {
      router.push(url);
    });
    const fg = notificationForegroundListener(() => {});

    return () => {
      sub.remove();
      fg.remove();
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    requestAndRegisterPushToken().catch((error) => {
      console.warn('Push token registration failed', error);
    });
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    let active = true;

    const loadNotifications = async () => {
      try {
        const items = await fetchNotifications();
        if (active) setNotifications(items as any);
      } catch (error) {
        console.warn('Failed to load notifications', error);
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isAuthenticated, token, setNotifications]);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
    </SafeAreaProvider>
  );
}
