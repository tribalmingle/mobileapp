import apiClient from './client';

export type UserProfile = {
  id: string;
  email?: string;
  name: string;
  isOnline?: boolean;
  lastActive?: string;
  age?: number;
  tribe?: string;
  city?: string;
  country?: string;
  heritage?: string;
  countryOfOrigin?: string;
  cityOfOrigin?: string;
  religion?: string;
  lookingFor?: string;
  bio?: string;
  interests?: string[];
  loveLanguage?: string;
  verified?: boolean;
  occupation?: string;
  education?: string;
  relationshipGoals?: string[];
  compatibility?: number;
  matchPercent?: number;
  matchReasons?: string[];
  matchBreakdown?: Array<{ key: string; label: string; score: number }>;
  photos: string[];
};

const mapUser = (raw: any): UserProfile => {
  const photos: string[] = Array.isArray(raw?.profilePhotos) && raw.profilePhotos.length > 0
    ? raw.profilePhotos
    : raw?.profilePhoto
      ? [raw.profilePhoto]
      : [];

  return {
    id: raw?._id || raw?.email || raw?.id,
    email: raw?.email,
    name: raw?.name || 'Member',
    age: raw?.age,
    tribe: raw?.tribe,
    city: raw?.city,
    country: raw?.country,
    heritage: raw?.heritage,
    countryOfOrigin: raw?.countryOfOrigin,
    cityOfOrigin: raw?.cityOfOrigin,
    religion: raw?.religion || raw?.faith,
    lookingFor: raw?.lookingFor,
    bio: raw?.bio,
    interests: raw?.interests,
    loveLanguage: raw?.loveLanguage,
    verified: raw?.verified,
    occupation: raw?.occupation,
    education: raw?.education,
    relationshipGoals: raw?.relationshipGoals,
    compatibility: raw?.compatibility,
    matchPercent: raw?.matchPercent,
    matchReasons: raw?.matchReasons,
    matchBreakdown: raw?.matchBreakdown,
    photos,
    isOnline: raw?.isOnline ?? raw?.is_online ?? raw?.online ?? undefined,
    lastActive: raw?.lastActive || raw?.last_active || raw?.lastSeen || raw?.last_seen || undefined,
  };
};

export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  if (!userId) return null;
  try {
    const safeId = encodeURIComponent(userId);
    const { data } = await apiClient.get<{ success?: boolean; user?: any }>(`/users/${safeId}`);
    if (data?.user) {
      return mapUser(data.user);
    }
  } catch (error) {
    console.warn('fetchUserProfile failed', error);
  }
  return null;
};

/** Fetch online status for a specific user */
export const fetchUserOnlineStatus = async (
  userId: string
): Promise<{ isOnline: boolean; lastActive?: string }> => {
  if (!userId) return { isOnline: false };
  try {
    const safeId = encodeURIComponent(userId);
    const { data } = await apiClient.get<any>(`/users/${safeId}/status`);
    return {
      isOnline:
        data?.isOnline ?? data?.is_online ?? data?.online ?? data?.user?.isOnline ?? false,
      lastActive:
        data?.lastActive || data?.last_active || data?.lastSeen || data?.user?.lastActive || undefined,
    };
  } catch {
    // If the endpoint doesn't exist, try fetching the full profile
    try {
      const profile = await fetchUserProfile(userId);
      return {
        isOnline: profile?.isOnline ?? false,
        lastActive: profile?.lastActive || undefined,
      };
    } catch {
      return { isOnline: false };
    }
  }
};
