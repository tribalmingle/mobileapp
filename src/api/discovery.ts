import apiClient, { isDemoMode } from './client';

export interface Recommendation {
  id: string;
  email?: string;
  name: string;
  age?: number;
  tribe?: string;
  city?: string;
  country?: string;
  bio?: string;
  prompt?: string;
  interests?: string[];
  compatibility?: number;
  verified?: boolean;
  photos: string[];
}

export interface RecommendationPage {
  results: Recommendation[];
  hasMore: boolean;
  page: number;
}

export interface DiscoverFilters {
  search?: string;
  maritalStatus?: string;
  minAge?: number;
  maxAge?: number;
  country?: string;
  city?: string;
  tribe?: string;
  religion?: string;
  education?: string;
  workType?: string;
}

const mapUserToRecommendation = (u: any): Recommendation => ({
  id: u._id || u.email || u.id,
  email: u.email,
  name: u.name,
  age: u.age,
  tribe: u.tribe,
  city: u.city,
  country: u.country,
  bio: u.bio,
  interests: u.interests,
  verified: u.verified,
  photos:
    Array.isArray(u.profilePhotos) && u.profilePhotos.length > 0
      ? u.profilePhotos
      : u.profilePhoto
        ? [u.profilePhoto]
        : [],
});

const demoFeed: Recommendation[] = [
  {
    id: 'demo-leila',
    name: 'Leila',
    age: 29,
    tribe: 'Yoruba',
    city: 'Lagos',
    country: 'Nigeria',
    prompt: 'Looking for someone who values faith and family dinners.',
    bio: 'Faith-forward, close to family, loves hosting Sunday dinners and discovering new music.',
    interests: ['Faith', 'Foodie trips', 'Photography', 'Podcasts'],
    compatibility: 93,
    verified: true,
    photos: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1000&q=80',
    ],
  },
  {
    id: 'demo-kabir',
    name: 'Kabir',
    age: 31,
    tribe: 'Hausa',
    city: 'Abuja',
    country: 'Nigeria',
    prompt: 'Weekend hikes + late-night suya runs.',
    bio: 'Hiker, reader, and aspiring chef. I value kindness, honesty, and showing up for community.',
    interests: ['Hiking', 'Cooking', 'Reading', 'Travel'],
    compatibility: 88,
    photos: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1000&q=80&sat=-40',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1000&q=80',
    ],
  },
  {
    id: 'demo-zara',
    name: 'Zara',
    age: 27,
    tribe: 'Igbo',
    city: 'Enugu',
    country: 'Nigeria',
    prompt: 'Building a life around kindness and creativity.',
    bio: 'Artist and strategist. I love markets, design, and meaningful conversations.',
    interests: ['Art', 'Design', 'Markets', 'Coffee'],
    compatibility: 90,
    verified: true,
    photos: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=1000&q=80',
    ],
  },
];

export const fetchRecommendations = async (
  filters: DiscoverFilters = {},
  page = 1,
  pageSize = 10,
): Promise<RecommendationPage> => {
  if (isDemoMode()) {
    return { results: demoFeed.slice(0, pageSize), hasMore: false, page };
  }

  try {
    // Use /users/discover which already accepts bearer tokens and supports search filters.
    const { data } = await apiClient.get<{ success: boolean; users?: any[]; count?: number }>(
      '/users/discover',
      {
        params: { ...filters, page, pageSize },
      },
    );

    if (data?.users) {
      const results: Recommendation[] = data.users.map(mapUserToRecommendation);

      return { results, hasMore: false, page };
    }
  } catch (error) {
    console.warn('fetchRecommendations failed, falling back to demo data', error);
  }

  return { results: demoFeed.slice(0, pageSize), hasMore: false, page };
};

export const sendSwipe = async (
  userId: string,
  action: 'like' | 'pass' | 'superlike',
): Promise<{ matchCreated?: boolean }> => {
  if (isDemoMode()) {
    return { matchCreated: action !== 'pass' };
  }

  const endpointMap: Record<typeof action, string> = {
    like: '/likes/like',
    pass: '/likes/pass',
    superlike: '/likes/superlike',
  };

  try {
    const { data } = await apiClient.post(endpointMap[action], { userId });
    return data || {};
  } catch (error) {
    console.warn('sendSwipe failed', { action, error });
    throw error;
  }
};
