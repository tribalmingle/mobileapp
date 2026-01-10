import { create } from 'zustand';
import { nanoid } from 'nanoid/non-secure';

export type NotificationItem = {
  id: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  createdAt: string;
  read: boolean;
};

type NotificationState = {
  items: NotificationItem[];
  unreadCount: number;
  addNotification: (payload: { title?: string; body?: string; data?: Record<string, unknown> }) => void;
  setNotifications: (items: NotificationItem[]) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clearAll: () => void;
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  unreadCount: 0,
  addNotification: ({ title, body, data }) => {
    const id = nanoid();
    const createdAt = new Date().toISOString();
    const item: NotificationItem = {
      id,
      title: title || 'Notification',
      body,
      data,
      createdAt,
      read: false,
    };
    const items = [item, ...get().items];
    set({ items, unreadCount: items.filter((n) => !n.read).length });
  },
  setNotifications: (items) => {
    const sorted = [...items].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    set({ items: sorted, unreadCount: sorted.filter((n) => !n.read).length });
  },
  markAllRead: () => {
    const items = get().items.map((n) => ({ ...n, read: true }));
    set({ items, unreadCount: 0 });
  },
  markRead: (id: string) => {
    const items = get().items.map((n) => (n.id === id ? { ...n, read: true } : n));
    set({ items, unreadCount: items.filter((n) => !n.read).length });
  },
  clearAll: () => set({ items: [], unreadCount: 0 }),
}));
