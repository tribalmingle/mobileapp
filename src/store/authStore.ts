import { create } from 'zustand';
import * as SecureStore from '@/utils/secureStore';
import apiClient from '@/api/client';
import { registerDeviceToken } from '../api/notifications';
import { identifyUser, trackEvent, captureError } from '@/lib/analytics';
import { User, AuthResponse, SignupData } from '@/types/user';

type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  pushToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  clearError: () => void;
  setPushToken: (token: string | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,
  isAuthenticated: false,
  error: null,
  pushToken: null,

  login: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<AuthResponse>('/auth/signin', { email, password }, { timeout: 12000 });
      const { token, user } = response.data;
      await SecureStore.setItemAsync('auth_token', token);
      identifyUser(user?._id || user?.id, { email: user?.email });
      trackEvent('login_success');
      set({ user, token, isAuthenticated: true, loading: false, error: null });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        (error?.code === 'ECONNABORTED' ? 'Request timed out. Please try again.' : undefined) ||
        error?.message ||
        'Login failed. Please try again.';
      console.warn('Login error', {
        status: error?.response?.status,
        data: error?.response?.data,
        message,
      });
      set({ loading: false, error: message, isAuthenticated: false });
      captureError(error, { context: 'login', message });
      throw new Error(message);
    }
  },

  signup: async (data: SignupData) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<AuthResponse>('/auth/signup', data);
      const { token, user } = response.data;
      await SecureStore.setItemAsync('auth_token', token);
      identifyUser(user?._id || user?.id, { email: user?.email });
      trackEvent('signup_success');
      set({ user, token, isAuthenticated: true, loading: false, error: null });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Signup failed. Please try again.';
      console.warn('Signup error', {
        status: error?.response?.status,
        data: error?.response?.data,
        message,
      });
      set({ loading: false, error: message, isAuthenticated: false });
      captureError(error, { context: 'signup', message });
      throw new Error(message);
    }
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync('auth_token');
    } catch (error) {
      console.error('Error deleting token:', error);
    }
    identifyUser(undefined, undefined);
    trackEvent('logout');
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  loadUser: async () => {
    const token = await SecureStore.getItemAsync('auth_token');
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false });
      return;
    }

    // Preserve session by default; only explicit logout should clear token
    set((state) => ({ ...state, token, isAuthenticated: true }));

    try {
      const response = await apiClient.get<{ user: User }>('/auth/me');
      identifyUser(response.data.user?._id || response.data.user?.id, { email: response.data.user?.email });
      set({ user: response.data.user, token, isAuthenticated: true });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to refresh session.';
      console.warn('loadUser error', {
        status: error?.response?.status,
        data: error?.response?.data,
        message,
      });
      // If token is invalid/expired, clear it so we don't spam 401s
      if (error?.response?.status === 401) {
        await SecureStore.deleteItemAsync('auth_token');
        set({ user: null, token: null, isAuthenticated: false, error: null });
      } else {
        set((state) => ({ ...state, error: message, isAuthenticated: true }));
        captureError(error, { context: 'loadUser', message });
      }
    }
  },

  forgotPassword: async (email: string) => {
    await apiClient.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, newPassword: string) => {
    await apiClient.post('/auth/reset-password', { token, newPassword });
  },

  updateUser: (userData: Partial<User>) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, ...userData };
      return { user: updatedUser };
    });
  },

  clearError: () => set({ error: null }),

  setPushToken: (token: string | null) => {
    set({ pushToken: token });
    if (token) {
      console.log('Expo push token:', token);
      registerDeviceToken(token).catch((err: unknown) => {
        const message = (err as any)?.message || String(err);
        console.warn('push token register failed', message);
      });
    }
  },
}));

