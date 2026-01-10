import apiClient from './client';

export interface BoostSummary {
  active?: boolean;
  remaining?: number;
  expiresAt?: string;
  minutesRemaining?: number;
  viewsGained?: number;
  spotlightWindows?: SpotlightWindow[];
}

export interface SpotlightWindow {
  id: string;
  start: string;
  end?: string;
  minBid?: number;
  currency?: string;
  currentHighestBid?: number;
  duration?: number;
}

export const getBoostSummary = async (): Promise<BoostSummary> => {
  const { data } = await apiClient.get<any>('/boosts/summary');
  const windows = Array.isArray(data?.spotlightWindows)
    ? data.spotlightWindows.map(normalizeWindow)
    : Array.isArray(data?.windows)
      ? data.windows.map(normalizeWindow)
      : [];
  const current = data?.currentBoost || data;

  return {
    active: current?.active,
    remaining: data?.remaining || data?.boostsLeft || current?.remaining,
    expiresAt: current?.endTime || current?.expiresAt,
    minutesRemaining: current?.minutesRemaining,
    viewsGained: current?.viewsGained,
    spotlightWindows: windows,
  };
};

export const fetchBoostSummary = getBoostSummary;

export const getSpotlightWindows = async (): Promise<SpotlightWindow[]> => {
  const { data } = await apiClient.get<{ windows?: any[] }>('/boosts/windows');
  const list = data?.windows || data;
  return Array.isArray(list) ? list.map(normalizeWindow) : [];
};

export const fetchBoostWindows = getSpotlightWindows;

export const placeSpotlightBid = async (payload: { windowTime: string; bidAmount: number }) => {
  await apiClient.post('/boosts/bid', payload);
};

export const activateBoost = async (): Promise<BoostSummary> => {
  const { data } = await apiClient.post<any>('/boosts/activate', {});
  return getBoostSummary().catch(() => normalizeSummary(data));
};

const normalizeSummary = (raw: any): BoostSummary => ({
  active: raw?.active,
  remaining: raw?.remaining,
  expiresAt: raw?.expiresAt,
  minutesRemaining: raw?.minutesRemaining,
  viewsGained: raw?.viewsGained,
});

const normalizeWindow = (raw: any): SpotlightWindow => ({
  id: raw?.id || raw?._id || raw?.windowId || 'unknown',
  start: raw?.start || raw?.startsAt || raw?.time,
  end: raw?.end || raw?.endsAt,
  minBid: raw?.minBid || raw?.minimumBid,
  currency: raw?.currency || raw?.curr,
  currentHighestBid: raw?.currentHighestBid,
  duration: raw?.duration,
});
