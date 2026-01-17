import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { registerDeviceToken } from '../api/notifications';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';

export const configureNotificationHandling = () => {
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
  if (!Constants.isDevice) {
    return null;
  }

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
  await registerDeviceToken(token);
  return token;
};

export const notificationResponseListener = (onDeepLink: (url: string) => void) => {
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
