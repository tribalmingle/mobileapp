import axios from 'axios';
import * as SecureStore from '@/utils/secureStore';
import { env } from '@/config/env';

// Demo mode is opt-in via env only.
const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';
export const API_BASE_URL = env.apiBaseUrl;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // Increase timeout to handle cold starts / slower network on web
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(
  async (config) => {
    console.log('[API] Request:', config.method?.toUpperCase(), config.url);
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        const bearer = `Bearer ${token}`;
        config.headers['X-Auth-Token'] = bearer;
        config.headers['Authorization'] = bearer;
        console.log('[API] Token attached');
      } else {
        console.log('[API] No token found');
      }
    } catch (error) {
      console.error('[API] Error retrieving token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => {
    console.log('[API] Response:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    // Use console.warn for expected client errors (404, 403) to avoid LogBox red screen
    const logFn = status && status >= 400 && status < 500 ? console.warn : console.error;
    logFn('[API] Request failed:', {
      url: error.config?.url,
      status,
      message: error.message,
    });
    // Do not auto-clear tokens on 401; we keep sessions until explicit logout
    return Promise.reject(error);
  }
);

export const isDemoMode = () => DEMO_MODE;
export default apiClient;
