import { Stack, router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@/theme';
import { useEffect } from 'react';
import { configureNotificationHandling, requestAndRegisterPushToken, registerPushTokenListener, notificationResponseListener, notificationForegroundListener } from '@/config/notifications';
import { initAnalytics, trackEvent } from '@/lib/analytics';
import { configureAnalyticsProvider } from '@/config/analytics';
import { useScreenTracking } from '@/hooks/useScreenTracking';
import { fetchNotifications } from '@/api/notifications';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import GuaranteedDatingPopup from '@/components/GuaranteedDatingPopup';
import SafetyReminderPopup from '@/components/SafetyReminderPopup';

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

    let active = true;
    const loadInitialResponse = async () => {
      try {
        const Notifications = await import('expo-notifications');
        const response = await Notifications.getLastNotificationResponseAsync();
        const url = (response?.notification?.request?.content?.data as any)?.deepLink as string | undefined;
        if (active && url) {
          router.push(url);
        }
      } catch (error) {
        console.warn('Failed to load initial notification response', error);
      }
    };

    loadInitialResponse();

    const sub = notificationResponseListener((url) => {
      router.push(url);
    });
    const fg = notificationForegroundListener(() => {});
    const tokenSub = registerPushTokenListener();

    return () => {
      active = false;
      sub.remove();
      fg.remove();
      tokenSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    console.log('[PUSH] Authenticated, requesting device token', {
      isAuthenticated,
      hasToken: !!token,
    });
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
      {isAuthenticated && <GuaranteedDatingPopup />}
      {isAuthenticated && <SafetyReminderPopup />}
    </SafeAreaProvider>
  );
}
