import { Stack, router, usePathname } from 'expo-router';
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
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { getPremiumEntitlementState, getRevenueCatCustomerInfo, initializeRevenueCat } from '@/lib/revenueCat';
import GuaranteedDatingPopup from '@/components/GuaranteedDatingPopup';
import SafetyReminderPopup from '@/components/SafetyReminderPopup';

export default function RootLayout() {
  useScreenTracking();
  const setNotifications = useNotificationStore((state) => state.setNotifications);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const pathname = usePathname();
  const hasPremiumAccess = useSubscriptionStore((state) => state.hasPremiumAccess);
  const subscriptionChecked = useSubscriptionStore((state) => state.subscriptionChecked);
  const freeAccessChosen = useSubscriptionStore((state) => state.freeAccessChosen);
  const setSubscriptionChecked = useSubscriptionStore((state) => state.setSubscriptionChecked);
  const setRevenueCatSubscription = useSubscriptionStore((state) => state.setRevenueCatSubscription);

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

  useEffect(() => {
    let active = true;

    const syncRevenueCat = async () => {
      const appUserId = user?._id || user?.id;
      const initialized = await initializeRevenueCat(appUserId);
      if (!initialized || !active) {
        if (active) setSubscriptionChecked(true);
        return;
      }

      const customerInfo = await getRevenueCatCustomerInfo();
      if (!active) return;

      if (!customerInfo) {
        setSubscriptionChecked(true);
        return;
      }

      const status = getPremiumEntitlementState(customerInfo);
      if (!active) return;

      setRevenueCatSubscription(status);
    };

    syncRevenueCat().catch((error) => {
      console.warn('[RevenueCat] Failed to sync subscription state', error);
      if (active) setSubscriptionChecked(true);
    });

    return () => {
      active = false;
    };
  }, [user?._id, user?.id, setRevenueCatSubscription, setSubscriptionChecked]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!subscriptionChecked) return;
    if (hasPremiumAccess()) return;
    if (freeAccessChosen) return;
    if (pathname === '/premium') return;

    router.replace('/premium');
  }, [isAuthenticated, subscriptionChecked, hasPremiumAccess, freeAccessChosen, pathname]);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
      {isAuthenticated && <GuaranteedDatingPopup />}
      {isAuthenticated && <SafetyReminderPopup />}
    </SafeAreaProvider>
  );
}
