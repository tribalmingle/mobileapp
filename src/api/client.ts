import axios from 'axios';
import * as SecureStore from '@/utils/secureStore';
import { env } from '@/config/env';

// Disable demo mode for real API wiring; can be toggled via env if needed.
const DEMO_MODE = false;
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
    console.error('[API] Request failed:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    // Do not auto-clear tokens on 401; we keep sessions until explicit logout
    return Promise.reject(error);
  }
);

export const isDemoMode = () => DEMO_MODE;
export default apiClient;
