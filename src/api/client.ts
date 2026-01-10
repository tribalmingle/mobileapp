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
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error retrieving token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Do not auto-clear tokens on 401; we keep sessions until explicit logout
    return Promise.reject(error);
  }
);

export const isDemoMode = () => DEMO_MODE;
export default apiClient;
