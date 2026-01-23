export type SubscriptionPlan = 'free' | 'monthly' | '3-month' | '6-month' | 'premium_plus' | 'guardian' | 'concierge';

export interface CulturalValues {
  spirituality: number;
  family: number;
  tradition: number;
  modernity: number;
  communityInvolvement: number;
}

export interface PrivacySettings {
  incognitoMode: boolean;
  showOnlineStatus: boolean;
  shareReadReceipts?: boolean;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface User {
  id?: string;
  _id?: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  displayName?: string;
  username?: string;
  age: number;
  gender: 'male' | 'female' | 'non-binary';
  country?: string;
  city?: string;
  heritage?: string;
  countryOfOrigin?: string;
  cityOfOrigin?: string;
  tribe?: string;
  bio?: string;
  height?: number;
  bodyType?: string;
  maritalStatus?: string;
  education?: string;
  occupation?: string;
  religion?: string;
  lookingFor?: string;
  relationshipGoals?: string[];
  interests?: string[];
  loveLanguage?: string;
  photos?: string[];
  profilePhoto?: string;
  profilePhotos?: string[];
  subscriptionPlan?: SubscriptionPlan;
  subscriptionExpiry?: Date | string;
  credits?: number;
  isVerified?: boolean;
  isOnline?: boolean;
  lastActive?: Date | string;
  culturalValues?: CulturalValues;
  privacySettings?: PrivacySettings;
  emergencyContacts?: EmergencyContact[];
  profileCompletion?: number;
  incognitoModeUntil?: string;
  isAdmin?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface SignupData {
  email: string;
  password: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'non-binary';
  country?: string;
  city?: string;
  tribe?: string;
  bio?: string;
  height?: number;
  education?: string;
  occupation?: string;
  relationshipGoals?: string[];
  interests?: string[];
  loveLanguage?: string;
  dateOfBirth?: string;
}
