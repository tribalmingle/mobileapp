import apiClient from './client';

export interface ConciergeRequest {
  id: string;
  status?: string;
  preference?: string;
  notes?: string;
  createdAt?: string;
}

export const fetchConciergeRequests = async (): Promise<ConciergeRequest[]> => {
  const { data } = await apiClient.get<{ requests?: any[] }>('/concierge/requests');
  return Array.isArray(data?.requests) ? data.requests.map(normalizeRequest) : [];
};

export const createConciergeRequest = async (payload: { preference: string; notes?: string }): Promise<ConciergeRequest> => {
  const { data } = await apiClient.post<any>('/concierge/request', payload);
  return normalizeRequest(data?.request || data);
};

const normalizeRequest = (raw: any): ConciergeRequest => ({
  id: raw?.id || raw?._id || raw?.requestId || 'unknown',
  status: raw?.status || 'pending',
  preference: raw?.preference || raw?.summary || raw?.topic,
  notes: raw?.notes,
  createdAt: raw?.createdAt,
});
