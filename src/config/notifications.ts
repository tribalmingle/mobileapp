import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { registerDeviceToken } from '../api/notifications';
import { emitPushEvent } from '../lib/notificationBus';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';

// Treat only Expo Go as unsupported for push (dev client should proceed).
const isExpoGo = (Constants as any).executionEnvironment === 'storeClient';

const getNotificationsModule = () => {
  if (isExpoGo) return null;
  return require('expo-notifications') as typeof import('expo-notifications');
};

const noopSubscription = { remove: () => {} };

const getUserId = () => {
  const user = useAuthStore.getState().user as any;
  return user?._id || user?.id || user?.userId || user?.uid || user?.email || undefined;
};

const ensureAndroidChannel = async () => {
  const Notifications = getNotificationsModule();
  if (!Notifications || Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    enableVibrate: true,
    enableLights: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
};

export const configureNotificationHandling = () => {
  const Notifications = getNotificationsModule();
  if (!Notifications) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ 
      shouldShowAlert: true, 
      shouldPlaySound: true, 
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  ensureAndroidChannel().catch((error) => {
    console.warn('Failed to configure Android notification channel', error);
  });
};

export const requestAndRegisterPushToken = async () => {
  try {
    console.log('[PUSH] requestAndRegisterPushToken start', {
      isExpoGo,
      isDevice: Device.isDevice,
      platform: Platform.OS,
      appVersion: Constants.expoConfig?.version,
    });
    if (isExpoGo || !Device.isDevice) {
      console.log('[PUSH] Skipping token request (Expo Go or not a device)');
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
    console.log('[PUSH] Permission status', { existingStatus, finalStatus });
    if (finalStatus !== 'granted') {
      console.log('[PUSH] Permission not granted, aborting token request');
      return null;
    }

    const devicePushToken = await Notifications.getDevicePushTokenAsync();
    const token = devicePushToken.data;
    const tokenType = devicePushToken.type as 'fcm' | 'apns';
    console.log('[PUSH] Device token received', {
      tokenType,
      tokenPreview: token ? `${token.slice(0, 6)}...${token.slice(-4)}` : null,
    });

    await ensureAndroidChannel();

    // store + register with backend
    useAuthStore.getState().setPushToken(token);
    try {
      await registerDeviceToken({
        userId: getUserId(),
        deviceToken: token,
        tokenType,
        platform: Platform.OS,
        deviceId: Device.osBuildId || undefined,
        deviceName: Device.deviceName || undefined,
        appVersion: Constants.expoConfig?.version,
      });
    } catch (error) {
      console.warn('Device token registration failed', error);
    }
    return token;
  } catch (error) {
    console.warn('Push token setup failed', error);
    return null;
  }
};

export const registerPushTokenListener = () => {
  const Notifications = getNotificationsModule();
  if (!Notifications) return noopSubscription;

  return Notifications.addPushTokenListener((token) => {
    const tokenType = token.type as 'fcm' | 'apns';
    useAuthStore.getState().setPushToken(token.data);
    registerDeviceToken({
      userId: getUserId(),
      deviceToken: token.data,
      tokenType,
      platform: Platform.OS,
      deviceId: Device.osBuildId || undefined,
      deviceName: Device.deviceName || undefined,
      appVersion: Constants.expoConfig?.version,
    }).catch((error) => {
      console.warn('Push token refresh registration failed', error);
    });
  });
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
      emitPushEvent(data as any);
      onReceive(data);
    }
  });
};
