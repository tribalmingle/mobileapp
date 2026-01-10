import apiClient from './client';

export const reportUser = async (payload: { reportedUserId: string; reason: string; description?: string }) => {
  const { data } = await apiClient.post('/trust/report', payload);
  return data;
};

export const blockUser = async (payload: { blockedUserId: string }) => {
  const { data } = await apiClient.post('/trust/block', payload);
  return data;
};

export type BlockedUser = {
  id: string;
  name?: string;
  reason?: string;
  blockedAt?: string;
};

export const fetchBlockedUsers = async (): Promise<BlockedUser[]> => {
  const { data } = await apiClient.get<any>('/trust/blocked');
  const list = data?.blocked || data;
  if (!Array.isArray(list)) return [];
  return list.map((u: any) => ({
    id: u?.id || u?._id || u?.userId || 'unknown',
    name: u?.name,
    reason: u?.reason,
    blockedAt: u?.blockedAt,
  }));
};

export const unblockUser = async (payload: { blockedUserId: string }) => {
  const { data } = await apiClient.post('/trust/unblock', payload);
  return data;
};

export const deleteAccount = async (payload: { reason?: string }) => {
  const { data } = await apiClient.delete('/account', { data: payload });
  return data;
};
