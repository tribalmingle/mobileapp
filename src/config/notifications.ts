import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { registerDeviceToken } from '../api/notifications';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';

const isExpoGo =
  Constants.appOwnership === 'expo' ||
  (Constants as any).executionEnvironment === 'storeClient';

const getNotificationsModule = () => {
  if (isExpoGo) return null;
  return require('expo-notifications') as typeof import('expo-notifications');
};

const noopSubscription = { remove: () => {} };

export const configureNotificationHandling = () => {
  const Notifications = getNotificationsModule();
  if (!Notifications) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ 
      shouldShowAlert: true, 
      shouldPlaySound: false, 
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
};

export const requestAndRegisterPushToken = async () => {
  try {
    if (isExpoGo || !Constants.isDevice) {
      return null;
    }

    const Notifications = getNotificationsModule();
    if (!Notifications) return null;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ||
      Constants.easConfig?.projectId ||
      (Constants as any)?.manifest2?.extra?.eas?.projectId;

    if (!projectId) {
      console.warn('Expo projectId missing; skip push token registration. Add extra.eas.projectId or run in EAS build.');
      return null;
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenResponse.data;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    // store + register with backend
    useAuthStore.getState().setPushToken(token);
    try {
      await registerDeviceToken(token);
    } catch (error) {
      console.warn('Device token registration failed', error);
    }
    return token;
  } catch (error) {
    console.warn('Push token setup failed', error);
    return null;
  }
};

export const notificationResponseListener = (onDeepLink: (url: string) => void) => {
  const Notifications = getNotificationsModule();
  if (!Notifications) return noopSubscription;
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response?.notification?.request?.content?.data as any;
    const url = data?.deepLink as string | undefined;
    if (url) {
      onDeepLink(url);
    }
  });
};

export const notificationForegroundListener = (onReceive: (data: any) => void) => {
  const add = useNotificationStore.getState().addNotification;
  const Notifications = getNotificationsModule();
  if (!Notifications) return noopSubscription;
  return Notifications.addNotificationReceivedListener((notification) => {
    const data = notification?.request?.content?.data;
    const title = notification?.request?.content?.title ?? undefined;
    const body = notification?.request?.content?.body ?? undefined;
    add({ title, body, data });
    if (data) {
      onReceive(data);
    }
  });
};
