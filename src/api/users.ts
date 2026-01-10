import apiClient from './client';

export type UserProfile = {
  id: string;
  email?: string;
  name: string;
  age?: number;
  tribe?: string;
  city?: string;
  country?: string;
  bio?: string;
  interests?: string[];
  verified?: boolean;
  occupation?: string;
  education?: string;
  relationshipGoals?: string[];
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
    bio: raw?.bio,
    interests: raw?.interests,
    verified: raw?.verified,
    occupation: raw?.occupation,
    education: raw?.education,
    relationshipGoals: raw?.relationshipGoals,
    photos,
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
