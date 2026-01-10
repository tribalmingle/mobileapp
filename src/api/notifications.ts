import apiClient from './client';
import { Platform } from 'react-native';

export type NotificationPayload = {
  id: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  read?: boolean;
  createdAt?: string;
};

export const registerDeviceToken = async (deviceToken: string) => {
  const platform = Platform.OS;
  const payload = { deviceToken, platform };
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
