import apiClient from './client';

export interface GuaranteedDatingStatus {
  status?: string;
  expiresAt?: string;
  matchId?: string;
  requestId?: string;
  daysRemaining?: number;
  match?: {
    name?: string;
    venue?: string;
    date?: string;
  };
}

export interface GuaranteedDatingRequest {
  loveLanguages?: string[];
  activities?: string[];
  dealBreakers?: string[];
  notes?: string;
  preferences?: Record<string, any>;
  paidAmount?: number;
}

export const submitGuaranteedDating = async (payload: GuaranteedDatingRequest): Promise<GuaranteedDatingStatus> => {
  const { data } = await apiClient.post<any>('/guaranteed-dating/request', payload);
  return normalizeStatus(data?.request || data);
};

export const getGuaranteedDatingStatus = async (): Promise<GuaranteedDatingStatus> => {
  const { data } = await apiClient.get<any>('/guaranteed-dating/status');
  return normalizeStatus(data?.request || data);
};

export const requestGuaranteedRefund = async (payload: { requestId: string; reason: string }) => {
  const { data } = await apiClient.post('/guaranteed-dating/refund', payload);
  return data;
};

export const submitGuaranteedFeedback = async (payload: {
  requestId: string;
  rating: number;
  feedback?: string;
  wentOnDate?: boolean;
  continuingRelationship?: boolean;
}) => {
  const { data } = await apiClient.put('/guaranteed-dating/feedback', payload);
  return data;
};

const normalizeStatus = (raw: any): GuaranteedDatingStatus => ({
  status: raw?.status || raw?.state,
  expiresAt: raw?.expiresAt || raw?.expiry,
  matchId: raw?.matchId,
  requestId: raw?.requestId || raw?._id,
  daysRemaining: raw?.daysRemaining,
  match: raw?.match
    ? {
        name: raw?.match?.user?.name,
        venue: raw?.match?.venue?.name,
        date: raw?.match?.venue?.date,
      }
    : undefined,
});
