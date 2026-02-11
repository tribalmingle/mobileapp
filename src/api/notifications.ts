import apiClient from './client';

export type NotificationPayload = {
  id: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  read?: boolean;
  createdAt?: string;
};

export type DeviceTokenType = 'fcm' | 'apns';

export type DeviceTokenPayload = {
  userId?: string;
  deviceToken: string;
  tokenType: DeviceTokenType;
  platform: string;
  deviceId?: string;
  deviceName?: string;
  appVersion?: string;
};

export const registerDeviceToken = async (payload: DeviceTokenPayload) => {
  const { data } = await apiClient.post('/notifications/device-token', payload);
  return data || { ok: true };
};

export const fetchNotifications = async (): Promise<NotificationPayload[]> => {
  const { data } = await apiClient.get<{ notifications?: NotificationPayload[] }>('/notifications');
  return data?.notifications || [];
};

export const markNotificationRead = async (id: string) => {
  const { data } = await apiClient.put(`/notifications/${id}/read`);
  return data || { ok: true };
};

export const markAllNotificationsRead = async () => {
  const { data } = await apiClient.put('/notifications/read-all');
  return data || { ok: true };
};
