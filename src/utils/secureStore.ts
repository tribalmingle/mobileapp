import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

type MaybeString = string | null;

// Fallback to localStorage on web where SecureStore is not available.
const webStorage = {
  async getItem(key: string): Promise<MaybeString> {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  },
  async setItem(key: string, value: string) {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, value);
  },
  async deleteItem(key: string) {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(key);
  },
};

export const getItemAsync = async (key: string): Promise<MaybeString> => {
  if (Platform.OS === 'web' || typeof SecureStore.getItemAsync !== 'function') {
    return webStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
};

export const setItemAsync = async (key: string, value: string) => {
  if (Platform.OS === 'web' || typeof SecureStore.setItemAsync !== 'function') {
    return webStorage.setItem(key, value);
  }
  return SecureStore.setItemAsync(key, value);
};

export const deleteItemAsync = async (key: string) => {
  if (Platform.OS === 'web' || typeof SecureStore.deleteItemAsync !== 'function') {
    return webStorage.deleteItem(key);
  }
  return SecureStore.deleteItemAsync(key);
};

export const isSecureStoreAvailable = async () => {
  if (Platform.OS === 'web' || typeof SecureStore.isAvailableAsync !== 'function') return false;
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
};