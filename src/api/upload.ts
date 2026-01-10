import * as SecureStore from '@/utils/secureStore';
// Use legacy API to keep getInfoAsync available without deprecation warnings on SDK 54
import * as FileSystem from 'expo-file-system/legacy';
import { API_BASE_URL, isDemoMode } from './client';

// Cloud function rejects oversized payloads; keep uploads under this tighter limit to avoid 413/"FUNCTION_PAYLOAD_TOO_LARGE".
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

const getMimeType = (uri: string) => {
  const extension = uri.split('.').pop()?.toLowerCase();
  if (!extension) return 'image/jpeg';
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  if (extension === 'heic' || extension === 'heif') return 'image/heic';
  return 'image/jpeg';
};

export const uploadImageAsync = async (uri: string, folder: 'profile' | 'selfie' | 'id-verification' | 'id' | 'general' = 'profile') => {
  if (!uri) throw new Error('Missing image to upload');

  // In demo mode, short-circuit to avoid hitting the network while keeping UI flow intact
  if (isDemoMode()) {
    return `${uri}?demo=true`;
  }

  const fileInfo = await FileSystem.getInfoAsync(uri);
  if (!fileInfo.exists) {
    throw new Error('File does not exist at provided path');
  }

  if (typeof fileInfo.size === 'number' && fileInfo.size > MAX_UPLOAD_BYTES) {
    const sizeMb = (fileInfo.size / (1024 * 1024)).toFixed(1);
    throw new Error(`Image is too large (${sizeMb} MB). Please upload a file under 5 MB.`);
  }

  const token = await SecureStore.getItemAsync('auth_token');
  const filename = uri.split('/').pop() || 'upload.jpg';
  const mimeType = getMimeType(filename);

  const formData = new FormData();
  formData.append('file', {
    uri,
    name: filename,
    type: mimeType,
  } as any);
  formData.append('folder', folder === 'id' ? 'id-verification' : folder);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  const responseText = await response.text();
  let data: any = {};

  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch (err) {
      const snippet = responseText.slice(0, 200);
      throw new Error(`Upload failed: ${snippet || 'Invalid response from server'}`);
    }
  }

  if (!response.ok || !data?.imageUrl) {
    const message = data?.message || `Upload failed (${response.status}).`;
    throw new Error(message);
  }

  return data.imageUrl as string;
};
