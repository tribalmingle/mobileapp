import { apiClient } from './client';

export interface OnboardingStepData {
  step: number;
  data: any;
}

export interface OnboardingStepResponse {
  success: boolean;
  step: number;
  completed: boolean;
  nextStep: number | null;
  profileComplete: boolean;
  profile: any;
}

export interface OnboardingStatus {
  currentStep: number;
  lastCompletedStep: number;
  completed: boolean;
  profileComplete: boolean;
  stepData: any;
}

export interface ProfileData {
  name?: string;
  dateOfBirth?: string;
  gender?: string;
  height?: number;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  tribe?: string;
  heritage?: string;
  faith?: string;
  bio?: string;
  interests?: string[];
  lookingFor?: string;
  ageRangeMin?: number;
  ageRangeMax?: number;
  maxDistance?: number;
  photos?: string[];
  verificationSelfie?: string;
  verificationIdUrl?: string;
  profileComplete?: boolean;
}

/**
 * Submit a single onboarding step
 */
export async function submitOnboardingStep(
  step: number,
  data: any
): Promise<OnboardingStepResponse> {
  const response = await apiClient.post('/onboarding/step', { step, data });
  return response.data;
}

/**
 * Get current onboarding progress
 */
export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  const response = await apiClient.get('/onboarding/step');
  return response.data;
}

/**
 * Submit complete profile (alternative to step-by-step)
 */
export async function submitCompleteProfile(
  data: ProfileData
): Promise<{ success: boolean; profile: any }> {
  const response = await apiClient.post('/onboarding/profile', data);
  return response.data;
}

/**
 * Get current profile during onboarding
 */
export async function getOnboardingProfile(): Promise<{ profile: any }> {
  const response = await apiClient.get('/onboarding/profile');
  return response.data;
}
