import { create } from 'zustand';
import * as SecureStore from '@/utils/secureStore';

const SETTINGS_KEY = 'tm_settings_v1';

type SettingsState = {
  distance: number;
  ageMin: number;
  ageMax: number;
  tribes: string;
  pushNotifications: boolean;
  emailUpdates: boolean;
  showOnlineStatus: boolean;
  readReceipts: boolean;
  paused: boolean;
  loading: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (patch: Partial<Omit<SettingsState, 'loading' | 'loadSettings' | 'updateSettings'>>) => Promise<void>;
};

const defaultSettings: Omit<SettingsState, 'loading' | 'loadSettings' | 'updateSettings'> = {
  distance: 50,
  ageMin: 21,
  ageMax: 45,
  tribes: '',
  pushNotifications: true,
  emailUpdates: false,
  showOnlineStatus: true,
  readReceipts: true,
  paused: false,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...defaultSettings,
  loading: false,

  loadSettings: async () => {
    set({ loading: true });
    try {
      const raw = await SecureStore.getItemAsync(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({ ...defaultSettings, ...parsed, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (err) {
      console.warn('settings load failed', err);
      set({ loading: false });
    }
  },

  updateSettings: async (patch) => {
    const next = { ...defaultSettings, ...get(), ...patch };
    set(next);
    try {
      await SecureStore.setItemAsync(SETTINGS_KEY, JSON.stringify(next));
    } catch (err) {
      console.warn('settings save failed', err);
    }
  },
}));
