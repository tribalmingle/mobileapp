import apiClient from './client';

export interface Club {
  id: string;
  name: string;
  members?: number;
  summary?: string;
  joined?: boolean;
}

export const fetchClubs = async (): Promise<Club[]> => {
  const { data } = await apiClient.get<{ clubs?: any[] }>('/community/clubs');
  const list = data?.clubs || data;
  return Array.isArray(list) ? list.map(normalizeClub) : [];
};

export const joinClub = async (clubId: string) => apiClient.post(`/community/clubs/${clubId}/join`, {});

const normalizeClub = (raw: any): Club => ({
  id: raw?.id || raw?._id || raw?.clubId || 'club',
  name: raw?.name || raw?.title,
  members: raw?.members || raw?.memberCount,
  summary: raw?.summary || raw?.description,
  joined: raw?.joined,
});
