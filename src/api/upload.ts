import * as SecureStore from '@/utils/secureStore';
// Use legacy API to keep getInfoAsync available without deprecation warnings on SDK 54
import * as FileSystem from 'expo-file-system/legacy';
import { API_BASE_URL, isDemoMode } from './client';
import { env } from '@/config/env';

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

  const safeFolder = folder === 'id' ? 'id-verification' : folder;

  const headers = token
    ? {
        Authorization: `Bearer ${token}`,
        'X-Auth-Token': `Bearer ${token}`,
      }
    : undefined;

  const performUpload = async (uploadUrl: string) => {
    const uploadResult = await FileSystem.uploadAsync(uploadUrl, uri, {
      fieldName: 'file',
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      headers,
      parameters: {
        folder: safeFolder,
      },
      mimeType,
    });

    let data: any = {};
    if (uploadResult.body) {
      try {
        data = JSON.parse(uploadResult.body);
      } catch (err) {
        const snippet = uploadResult.body.slice(0, 200);
        console.warn('[upload] Non-JSON response', { uploadUrl, status: uploadResult.status, snippet });
        throw new Error(`Upload failed: ${snippet || 'Invalid response from server'}`);
      }
    }

    const resolvedUrl =
      data?.imageUrl ||
      data?.fileUrl ||
      (data?.path && env.uploadBaseUrl ? `${env.uploadBaseUrl}/media/${data.path}` : null);

    if (uploadResult.status !== 200 || !resolvedUrl) {
      const message = data?.message || data?.error || `Upload failed (${uploadResult.status}).`;
      console.warn('[upload] Upload failed', {
        uploadUrl,
        status: uploadResult.status,
        body: uploadResult.body?.slice(0, 200),
        message,
      });
      const error = new Error(message);
      (error as any).status = uploadResult.status;
      throw error;
    }

    return resolvedUrl as string;
  };

  const primaryUrl = `${API_BASE_URL}/upload`;
  try {
    return await performUpload(primaryUrl);
  } catch (err: any) {
    const status = err?.status;
    const shouldRetry = (status === 401 || status === 403) && /www\./i.test(API_BASE_URL);
    if (!shouldRetry) throw err;
    const fallbackBase = API_BASE_URL.replace(/www\./i, '');
    const fallbackUrl = `${fallbackBase}/upload`;
    console.warn('[upload] Retrying upload without www', { primaryUrl, fallbackUrl, status });
    return await performUpload(fallbackUrl);
  }
};
