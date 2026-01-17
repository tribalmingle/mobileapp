import apiClient, { isDemoMode } from './client';

export interface MatchUser {
  id: string;
  name: string;
  age?: number;
  gender?: 'male' | 'female' | 'non-binary' | 'other';
  email?: string;
  tribe?: string;
  city?: string;
  country?: string;
  bio?: string;
  interests?: string[];
  photo?: string;
  status?: string;
}

export interface MatchesResponse {
  matches: MatchUser[];
}

export interface IncomingLikesResponse {
  incomingLikes: MatchUser[];
}

export interface SentLikesResponse {
  sentLikes: MatchUser[];
}

export interface ViewsResponse {
  views: MatchUser[];
}

const demoMatches: MatchUser[] = [
  {
    id: 'nia',
    name: 'Nia',
    age: 28,
    tribe: 'Bini',
    city: 'Benin City',
    status: 'New match',
    photo: 'https://randomuser.me/api/portraits/women/65.jpg',
    interests: ['Family', 'Foodie trips', 'Reading'],
    bio: 'Teacher who loves family dinners and street food adventures.',
  },
  {
    id: 'ayo',
    name: 'Ayo',
    age: 30,
    tribe: 'Yoruba',
    city: 'Ibadan',
    status: 'Recently active',
    photo: 'https://randomuser.me/api/portraits/men/52.jpg',
    interests: ['Poetry', 'Afrobeats', 'Cooking'],
    bio: 'Writer and music lover. Looking for someone sincere and joyful.',
  },
];

const demoIncoming: MatchUser[] = [
  {
    id: 'ada',
    name: 'Ada',
    age: 27,
    tribe: 'Igbo',
    city: 'Enugu',
    status: 'Sent a like',
    photo: 'https://randomuser.me/api/portraits/women/22.jpg',
    interests: ['Faith', 'Travel', 'Design'],
    bio: 'Designer exploring faith, community, and good coffee shops.',
  },
];

export const fetchMatches = async (): Promise<MatchUser[]> => {
  if (isDemoMode()) return demoMatches;

  try {
    // Backend returns { success, data }
    const { data } = await apiClient.get<{ success: boolean; data?: any[] }>('/matches');
    if (Array.isArray(data?.data)) {
      return data.data.map((m) => ({
        id: m.id || m._id || m.userId || m.email,
        name: m.name,
        age: m.age,
        gender: m.gender,
        email: m.email,
        tribe: m.tribe,
        city: m.city,
        country: m.country,
        bio: m.bio,
        interests: m.interests,
        photo: m.profilePhoto || m.photo,
        status: m.status,
      }));
    }
  } catch (error) {
    console.warn('fetchMatches failed, using demo matches', error);
  }
  return demoMatches;
};

export const fetchIncomingLikes = async (): Promise<MatchUser[]> => {
  if (isDemoMode()) return demoIncoming;

  try {
    // Backend route is /likes/liked-me returning { success, likes }
    const { data } = await apiClient.get<{ success: boolean; likes?: any[] }>('/likes/liked-me');
    if (Array.isArray(data?.likes)) {
      return data.likes.map((l) => ({
        id: l.userId || l._id || l.email,
        name: l.name,
        age: l.age,
        gender: l.gender,
        email: l.email,
        tribe: l.tribe,
        city: l.city,
        country: l.country,
        bio: l.bio,
        interests: l.interests,
        photo: l.profilePhoto || l.photo,
        status: 'Sent a like',
      }));
    }
  } catch (error) {
    console.warn('fetchIncomingLikes failed, using demo incoming likes', error);
  }
  return demoIncoming;
};

export const fetchSentLikes = async (): Promise<MatchUser[]> => {
  if (isDemoMode()) return demoMatches;

  try {
    // Backend route is /likes/i-liked returning { success, likes }
    const { data } = await apiClient.get<{ success: boolean; likes?: any[] }>('/likes/i-liked');
    if (Array.isArray(data?.likes)) {
      return data.likes.map((l) => ({
        id: l.userId || l._id || l.email,
        name: l.name,
        age: l.age,
        gender: l.gender,
        email: l.email,
        tribe: l.tribe,
        city: l.city,
        country: l.country,
        bio: l.bio,
        interests: l.interests,
        photo: l.profilePhoto || l.photo,
        status: 'You liked',
      }));
    }
  } catch (error) {
    console.warn('fetchSentLikes failed, using demo matches', error);
  }
  return demoMatches;
};

export const fetchViews = async (): Promise<MatchUser[]> => {
  if (isDemoMode()) return demoIncoming;

  try {
    // Backend route is /profile/views returning { success, views }
    const { data } = await apiClient.get<{ success: boolean; views?: any[] }>('/profile/views');
    if (Array.isArray(data?.views)) {
      return data.views.map((v) => ({
        id: v.userId || v._id || v.email,
        name: v.name,
        age: v.age,
        gender: v.gender,
        email: v.email,
        tribe: v.tribe,
        city: v.city,
        country: v.country,
        bio: v.bio,
        interests: v.interests,
        photo: v.profilePhoto || v.photo,
        status: 'Viewed you',
      }));
    }
  } catch (error) {
    console.warn('fetchViews failed, using demo incoming', error);
  }
  return demoIncoming;
};

export const acceptLike = async (userId: string) => {
  if (isDemoMode()) return { matchCreated: true };
  try {
    const { data } = await apiClient.post('/likes/accept', { userId });
    return data || {};
  } catch (error) {
    console.warn('acceptLike failed', error);
    throw error;
  }
};

export const declineLike = async (userId: string) => {
  if (isDemoMode()) return { success: true };
  try {
    const { data } = await apiClient.post('/likes/decline', { userId });
    return data || {};
  } catch (error) {
    console.warn('declineLike failed', error);
    throw error;
  }
};
