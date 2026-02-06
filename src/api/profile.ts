import apiClient, { isDemoMode } from './client';
import { User } from '@/types/user';

export interface ProfileUpdatePayload {
  photos: string[];
  selfiePhoto: string;
  idVerificationUrl: string;
  idVerificationType: string;
  location: { country: string; city: string; state?: string; latitude?: number; longitude?: number };
  heritage: { country: string; tribe: string };
  personalDetails: {
    height: string;
    bodyType: string;
    maritalStatus: string;
    education: string;
  };
  work: { occupation: string; workType: string };
  faith: string;
  interests: string[];
  loveLanguage?: string[];
  bio: string;
  lookingFor: string;
  ageRangeMin?: number;
  ageRangeMax?: number;
  maxDistance?: number;
  profileCompleted?: boolean;
}

export type ProfileDraftPayload = Partial<ProfileUpdatePayload>;

interface ProfileUpdateResponse {
  user?: User;
  success?: boolean;
}

const toBackendPayload = (payload: ProfileDraftPayload | ProfileUpdatePayload) => {
  const body: Record<string, any> = {};

  const tryNumber = (value?: string) => {
    if (!value) return undefined;
    const num = Number(value);
    return Number.isNaN(num) ? value : num;
  };

  if ('bio' in payload && payload.bio !== undefined) body.bio = payload.bio;
  if (payload.location?.country) body.country = payload.location.country;
  if (payload.location?.city) body.city = payload.location.city;
  if (payload.location?.state) body.state = payload.location.state;
  if (payload.location?.latitude !== undefined && payload.location?.longitude !== undefined) {
    body.latitude = payload.location.latitude;
    body.longitude = payload.location.longitude;
  }
  if (payload.heritage?.country) body.heritage = payload.heritage.country;
  if (payload.heritage?.tribe) body.tribe = payload.heritage.tribe;

  const heightVal = tryNumber(payload.personalDetails?.height as string | undefined);
  if (heightVal !== undefined) body.height = heightVal;
  if (payload.personalDetails?.bodyType) body.bodyType = payload.personalDetails.bodyType;
  if (payload.personalDetails?.maritalStatus) body.maritalStatus = payload.personalDetails.maritalStatus;
  if (payload.personalDetails?.education) body.education = payload.personalDetails.education;

  if (payload.work?.occupation) body.occupation = payload.work.occupation;
  if (payload.work?.workType) body.workType = payload.work.workType;
  if (payload.faith) body.religion = payload.faith;
  if (payload.interests) body.interests = payload.interests;
  if (payload.loveLanguage && payload.loveLanguage.length > 0) {
    body.loveLanguage = payload.loveLanguage[0];
    body.loveLanguages = payload.loveLanguage;
  }
  if (payload.lookingFor) body.lookingFor = payload.lookingFor;

  if (payload.photos) {
    body.profilePhotos = payload.photos;
    if (Array.isArray(payload.photos) && payload.photos.length > 0) {
      body.profilePhoto = payload.photos[0];
    }
  }

  if (payload.selfiePhoto) {
    body.selfiePhoto = payload.selfiePhoto;
    body.verificationSelfie = payload.selfiePhoto;
  }

  if (payload.idVerificationUrl) {
    body.idVerificationUrl = payload.idVerificationUrl;
    body.verificationIdUrl = payload.idVerificationUrl;
  }

  if (payload.idVerificationType) {
    body.idVerificationType = payload.idVerificationType;
    body.verificationIdType = payload.idVerificationType;
  }

  if ('profileCompleted' in payload && payload.profileCompleted !== undefined) {
    body.profileCompleted = payload.profileCompleted;
  }

  return body;
};

export const updateProfile = async (payload: ProfileUpdatePayload) => {
  if (isDemoMode()) {
    // Simulate a network delay for demo mode
    await new Promise((resolve) => setTimeout(resolve, 400));
    return { data: { success: true } as ProfileUpdateResponse };
  }

  return apiClient.put<ProfileUpdateResponse>('/profile/update', toBackendPayload(payload));
};

export const saveProfileDraft = async (payload: ProfileDraftPayload) => {
  if (isDemoMode()) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return { data: { success: true } as ProfileUpdateResponse };
  }

  // Backend only exposes PUT for this route; it tolerates partial bodies, so we reuse PUT here.
  return apiClient.put<ProfileUpdateResponse>('/profile/update', toBackendPayload(payload));
};
