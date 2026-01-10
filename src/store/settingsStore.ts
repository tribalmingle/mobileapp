import { create } from 'zustand';
import * as SecureStore from '@/utils/secureStore';
import apiClient from '@/api/client';

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
  error: string | null;
  loadSettings: () => Promise<void>;
  updateSettings: (patch: Partial<Omit<SettingsState, 'loading' | 'loadSettings' | 'updateSettings' | 'error'>>) => Promise<void>;
};

const defaultSettings: Omit<SettingsState, 'loading' | 'loadSettings' | 'updateSettings' | 'error'> = {
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
  error: null,

  loadSettings: async () => {
    set({ loading: true, error: null });
    try {
      // Fetch from backend first
      const { data } = await apiClient.get('/account/settings');
      const serverSettings = data?.settings || {};
      
      // Merge server settings with defaults
      const merged = { ...defaultSettings, ...serverSettings };
      set({ ...merged, loading: false });
      
      // Cache locally
      await SecureStore.setItemAsync(SETTINGS_KEY, JSON.stringify(merged));
    } catch (err) {
      console.warn('Failed to load settings from server, using local cache', err);
      // Fallback to local cache
      try {
        const raw = await SecureStore.getItemAsync(SETTINGS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          set({ ...defaultSettings, ...parsed, loading: false });
        } else {
          set({ loading: false });
        }
      } catch (cacheErr) {
        console.warn('Local settings cache failed', cacheErr);
        set({ loading: false, error: 'Failed to load settings' });
      }
    }
  },

  updateSettings: async (patch) => {
    const current = get();
    const next = { ...defaultSettings, distance: current.distance, ageMin: current.ageMin, ageMax: current.ageMax, tribes: current.tribes, pushNotifications: current.pushNotifications, emailUpdates: current.emailUpdates, showOnlineStatus: current.showOnlineStatus, readReceipts: current.readReceipts, paused: current.paused, ...patch };
    
    // Optimistic update
    set({ ...next, loading: true, error: null });
    
    try {
      // Save to local cache immediately
      await SecureStore.setItemAsync(SETTINGS_KEY, JSON.stringify(next));
      
      // Sync to backend
      await apiClient.put('/account/settings', {
        distance: next.distance,
        ageMin: next.ageMin,
        ageMax: next.ageMax,
        tribes: next.tribes,
        pushNotifications: next.pushNotifications,
        emailUpdates: next.emailUpdates,
        showOnlineStatus: next.showOnlineStatus,
        readReceipts: next.readReceipts,
        paused: next.paused,
      });
      
      set({ loading: false });
    } catch (err) {
      console.warn('Failed to sync settings to server', err);
      // Keep local changes even if server sync fails
      set({ loading: false, error: 'Settings saved locally, will sync when online' });
    }
  },
}));
