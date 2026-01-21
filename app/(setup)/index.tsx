import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, Text, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import Svg, { Path } from 'react-native-svg';
import { AfricanTribalPattern, PatternColors } from '@/components/AfricanTribalPattern';
import { ProfileDraftPayload, ProfileUpdatePayload, saveProfileDraft, updateProfile } from '@/api/profile';
import { submitOnboardingStep, getOnboardingStatus } from '@/api/onboarding';
import { useAuthStore } from '@/store/authStore';
import { colors, spacing, typography, borderRadius, shadows } from '@/theme';
import { User } from '@/types/user';

import PhotoUploadStep from './PhotoUploadStep';
import IDVerificationStep from './IDVerificationStep';
import SelfieVerificationStep from './SelfieVerificationStep';
import LocationStep from './LocationStep';
import HeritageStep from './HeritageStep';
import PersonalDetailsStep from './PersonalDetailsStep';
import WorkStep from './WorkStep';
import FaithStep from './FaithStep';
import InterestsStep from './InterestsStep';
import BioStep from './BioStep';
import LookingForStep from './LookingForStep';

const { width, height } = Dimensions.get('window');

interface ProfileSetupWizardProps {
  initialStep?: number;
}

interface ProfileData {
  photos: string[];
  idVerification: { url: string; type: string };
  selfiePhoto: string;
  location: { country: string; city: string };
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
  bio: string;
  lookingFor: string;
}

const totalSteps = 13;

export default function ProfileSetupWizard({ initialStep = 1 }: ProfileSetupWizardProps) {
  const router = useRouter();
  const { updateUser, loadUser, user } = useAuthStore();
  const clampStep = (step: number) => Math.min(Math.max(step, 1), totalSteps);
  const [currentStep, setCurrentStep] = useState(() => clampStep(initialStep));
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingStep, setIsSavingStep] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydratedFromUser, setHydratedFromUser] = useState(false);
  const [busyMessage, setBusyMessage] = useState('Saving...');
  const emptyProfile: ProfileData = {
    photos: [],
    idVerification: { url: '', type: 'national_id' },
    selfiePhoto: '',
    location: { country: '', city: '' },
    heritage: { country: '', tribe: '' },
    personalDetails: {
      height: '',
      bodyType: '',
      maritalStatus: '',
      education: '',
    },
    work: { occupation: '', workType: '' },
    faith: '',
    interests: [],
    bio: '',
    lookingFor: '',
  };

  const [profileData, setProfileData] = useState<ProfileData>(emptyProfile);
  const profileDataRef = useRef(profileData);

  useEffect(() => {
    profileDataRef.current = profileData;
  }, [profileData]);

  useEffect(() => {
    if (user && !hydratedFromUser) {
      setProfileData((prev) => {
        const hasLocalData =
          prev.photos.length > 0 ||
          !!prev.bio ||
          !!prev.location.country ||
          !!prev.location.city;
        if (hasLocalData) return prev;
        return mapUserToProfile(user);
      });
      setHydratedFromUser(true);
    }
  }, [user, hydratedFromUser]);

  useEffect(() => {
    if (!error) return;
    const timeoutId = setTimeout(() => setError(null), 3000);
    return () => clearTimeout(timeoutId);
  }, [error]);

  const isNonEmpty = (value: unknown) => {
    if (Array.isArray(value)) return value.length > 0;
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length > 0;
    return true;
  };

  const pruneObject = <T extends Record<string, any>>(obj: T): Partial<T> =>
    Object.fromEntries(Object.entries(obj).filter(([, v]) => isNonEmpty(v)));

  const buildPayloadForStep = (step: number, markComplete = false): ProfileDraftPayload => {
    const payload: ProfileDraftPayload = {};
    const add = (key: keyof ProfileDraftPayload, value: any) => {
      if (isNonEmpty(value)) {
        (payload as any)[key] = value;
      }
    };

    switch (step) {
      case 1:
        add('photos', profileData.photos);
        break;
      case 2: {
        const loc = pruneObject(profileData.location);
        if (Object.keys(loc).length) add('location', loc);
        break;
      }
      case 3: {
        const heritage = pruneObject(profileData.heritage);
        if (Object.keys(heritage).length) add('heritage', heritage);
        break;
      }
      case 4: {
        const personal = pruneObject(profileData.personalDetails);
        if (Object.keys(personal).length) add('personalDetails', personal);
        break;
      }
      case 5: {
        const work = pruneObject(profileData.work);
        if (Object.keys(work).length) add('work', work);
        break;
      }
      case 6:
        add('faith', profileData.faith);
        break;
      case 7:
        add('interests', profileData.interests);
        break;
      case 8:
        add('bio', profileData.bio);
        break;
      case 9:
        add('lookingFor', profileData.lookingFor);
        break;
      case 10:
        add('idVerificationUrl', profileData.idVerification.url);
        add('idVerificationType', profileData.idVerification.type);
        break;
      case 11:
        add('selfiePhoto', profileData.selfiePhoto);
        break;
      default:
        break;
    }

    if (markComplete) {
      payload.profileCompleted = true;
    }

    return payload;
  };

  const buildCompletePayload = (): ProfileUpdatePayload => ({
    photos: profileData.photos,
    selfiePhoto: profileData.selfiePhoto,
    idVerificationUrl: profileData.idVerification.url,
    idVerificationType: profileData.idVerification.type,
    location: profileData.location,
    heritage: profileData.heritage,
    personalDetails: profileData.personalDetails,
    work: profileData.work,
    faith: profileData.faith,
    interests: profileData.interests,
    bio: profileData.bio,
    lookingFor: profileData.lookingFor,
    profileCompleted: true,
  });

  const updateProfileData = (data: Partial<ProfileData>) => {
    setProfileData((prev) => {
      const next = { ...prev, ...data };
      profileDataRef.current = next;
      return next;
    });
    setError(null);
  };

  const getBackendStep = (wizardStep: number): number | null => {
    switch (wizardStep) {
      case 1: // Photos
        return 8;
      case 2: // Location
        return 4;
      case 3: // Heritage
        return 2;
      case 4: // Personal Details (missing required backend fields)
        return null;
      case 5: // Work (not supported by onboarding/step)
        return null;
      case 6: // Faith
        return 3;
      case 7: // Interests
        return 6;
      case 8: // Bio
        return 5;
      case 9: // Looking For
        return 7;
      case 10: // ID Verification
        return 10;
      case 11: // Selfie
        return 9;
      default:
        return null;
    }
  };

  const persistStep = async (step: number) => {
    const payload = buildPayloadForStep(step);
    if (!payload || Object.keys(payload).length === 0) return;

    setBusyMessage('Saving...');
    setIsSavingStep(true);
    setError(null);

    try {
      // Use new onboarding/step endpoint when the backend expects this step
      const backendStep = getBackendStep(step);
      if (backendStep) {
        const stepData = convertPayloadToStepData(backendStep, payload);
        const response = await submitOnboardingStep(backendStep, stepData);

        if (response.profile) {
          // Update user with latest profile data
          updateUser(response.profile);
        }
      }
      
      // Also try old endpoint for backward compatibility
      try {
        const legacyResponse = await saveProfileDraft(payload);
        if (legacyResponse.data?.user) {
          updateUser(legacyResponse.data.user);
        }
      } catch (legacyErr) {
        console.warn('Legacy profile draft save failed:', legacyErr);
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to save this step.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSavingStep(false);
    }
  };

  // Convert wizard payload to step data format expected by backend
  const convertPayloadToStepData = (step: number, payload: ProfileDraftPayload): any => {
    switch (step) {
      case 8: // Photo Upload
        return { photos: payload.photos };
      case 4: // Location
        return {
          city: payload.location?.city,
          state: payload.location?.state,
          country: payload.location?.country,
          latitude: payload.location?.latitude,
          longitude: payload.location?.longitude
        };
      case 2: // Heritage
        return {
          tribe: payload.heritage?.tribe,
          heritage: payload.heritage?.country
        };
      case 3: // Faith
        return { faith: payload.faith };
      case 6: // Interests
        return { interests: payload.interests };
      case 5: // Bio
        return { bio: payload.bio };
      case 7: // Looking For
        return {
          lookingFor: payload.lookingFor,
          ageRangeMin: payload.ageRangeMin,
          ageRangeMax: payload.ageRangeMax,
          maxDistance: payload.maxDistance
        };
      case 10: // ID Verification
        return {
          verificationIdUrl: payload.idVerificationUrl,
          verificationStatus: 'pending'
        };
      case 9: // Selfie
        return { verificationSelfie: payload.selfiePhoto };
      default:
        return payload;
    }
  };

  const handleNext = async () => {
    const validationMessage = validateStep(currentStep);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }
    setError(null);

    if (currentStep === totalSteps - 1) {
      await handleComplete();
      return;
    }

    try {
      await persistStep(currentStep);
    } catch {
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    if (currentStep === totalSteps - 1) {
      await handleComplete();
      return;
    }

    const validationMessage = validateStep(currentStep);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setError(null);

    try {
      await persistStep(currentStep);
    } catch {
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    setBusyMessage('Saving your profile...');
    setError(null);

    try {
      const token = await SecureStore.getItemAsync('auth_token');

      if (!token) {
        setError('Please log in to complete your profile setup.');
        setIsLoading(false);
        return;
      }

      const response = await updateProfile(buildCompletePayload());

      if (response.data?.user) {
        updateUser(response.data.user);
      } else {
        await loadUser();
      }

      updateUser({ profileCompletion: 100 });
      setBusyMessage('Checking verification status...');

      await pollVerificationStatus();
      setCurrentStep(totalSteps);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to save profile. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const pollVerificationStatus = async (maxAttempts = 10, delayMs = 4000) => {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        await loadUser();
        const latest = useAuthStore.getState().user;
        if (latest?.isVerified) {
          return true;
        }
      } catch (err) {
        console.warn('Verification poll failed', err);
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    return false;
  };

  const validateStep = (step: number): string | null => {
    const data = profileDataRef.current;
    switch (step) {
      case 1:
        return data.photos.length > 0 ? null : 'Please upload at least one photo to continue.';
      case 2:
        return data.location.country && data.location.city
          ? null
          : 'Please add your country and city (or detect location).';
      case 3:
        return data.heritage.tribe ? null : 'Please add your tribe (heritage).';
      case 4:
        return data.personalDetails.education ? null : 'Please add at least your education.';
      case 5:
        return data.work.occupation ? null : 'Please add your occupation.';
      case 6:
        return data.faith ? null : 'Please select your faith.';
      case 7:
        return data.interests.length ? null : 'Please select at least one interest.';
      case 8:
        return data.bio ? null : 'Please add a short bio.';
      case 9:
        return data.lookingFor ? null : 'Please tell us what you are looking for.';
      case 10:
        return data.idVerification.url ? null : 'Please upload an ID document.';
      case 11:
        return data.selfiePhoto ? null : 'Please upload a selfie for verification.';
      default:
        return null;
    }
  };

  const renderStep = () => {
    const commonProps = {
      onNext: handleNext,
      onBack: handleBack,
      onSkip: handleSkip,
      currentStep,
      totalSteps,
    };

    switch (currentStep) {
      case 1:
        return (
          <PhotoUploadStep
            {...commonProps}
            photos={profileData.photos}
            onUpdate={(photos) => updateProfileData({ photos })}
          />
        );
      case 2:
        return (
          <LocationStep
            {...commonProps}
            location={profileData.location}
            onUpdate={(location) => updateProfileData({ location })}
          />
        );
      case 3:
        return (
          <HeritageStep
            {...commonProps}
            heritage={profileData.heritage}
            onUpdate={(heritage) => updateProfileData({ heritage })}
          />
        );
      case 4:
        return (
          <PersonalDetailsStep
            {...commonProps}
            personalDetails={profileData.personalDetails}
            onUpdate={(personalDetails) => updateProfileData({ personalDetails })}
          />
        );
      case 5:
        return (
          <WorkStep
            {...commonProps}
            work={profileData.work}
            onUpdate={(work) => updateProfileData({ work })}
          />
        );
      case 6:
        return (
          <FaithStep
            {...commonProps}
            faith={profileData.faith}
            onUpdate={(faith) => updateProfileData({ faith })}
          />
        );
      case 7:
        return (
          <InterestsStep
            {...commonProps}
            interests={profileData.interests}
            onUpdate={(interests) => updateProfileData({ interests })}
          />
        );
      case 8:
        return (
          <BioStep
            {...commonProps}
            bio={profileData.bio}
            onUpdate={(bio) => updateProfileData({ bio })}
          />
        );
      case 9:
        return (
          <LookingForStep
            {...commonProps}
            lookingFor={profileData.lookingFor}
            onUpdate={(lookingFor) => updateProfileData({ lookingFor })}
          />
        );
      case 10:
        return (
          <IDVerificationStep
            {...commonProps}
            idVerification={profileData.idVerification}
            onUpdate={(idVerification) => updateProfileData({ idVerification })}
          />
        );
      case 11:
        return (
          <SelfieVerificationStep
            {...commonProps}
            selfieUrl={profileData.selfiePhoto}
            onUpdate={(selfiePhoto) => updateProfileData({ selfiePhoto })}
          />
        );
      case 12:
        return (
          <ReviewStep
            {...commonProps}
            profile={profileData}
          />
        );
      case 13:
        return (
          <CompletionStep
            onContinue={() => router.replace('/(tabs)/home')}
          />
        );
      default:
        return null;
    }
  };

  const isBusy = isLoading || isSavingStep;
  const busyText = busyMessage;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0A0A0A', '#1a0a2e']} style={styles.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <AfricanTribalPattern color={PatternColors.darkPurple} opacity={0.3} />

        {isBusy ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.text.primary} />
            <Text style={styles.loadingText}>{busyText}</Text>
          </View>
        ) : (
          <>
            {renderStep()}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.navy,
  },
  gradient: {
    flex: 1,
    width,
    height,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B9D',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    ...typography.styles.h3,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.sans,
    textAlign: 'center',
  },
  errorContainer: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: 'rgba(239, 68, 68, 0.95)',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    ...shadows.md,
  },
  errorText: {
    color: colors.text.primary,
    ...typography.styles.body,
    fontFamily: typography.fontFamily.sans,
    textAlign: 'center',
  },
  backButton: { padding: 8 },
  skipText: { fontSize: 16, color: 'rgba(255, 255, 255, 0.7)', fontWeight: '600' },
  scrollView: { flex: 1 },
  reviewContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  reviewTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  reviewContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  reviewLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    flex: 1,
    marginRight: 12,
  },
  reviewValue: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  reviewHint: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    marginTop: 12,
  },
  actions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(49, 46, 129, 0.95)',
  },
  submitButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  submitGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  successCard: {
    margin: 24,
    padding: 24,
    borderRadius: 20,
    backgroundColor: 'rgba(157, 78, 221, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
});

interface ReviewStepProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  currentStep: number;
  totalSteps: number;
  profile: ProfileData;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ onNext, onBack, onSkip, currentStep, totalSteps, profile }) => {
  const rows = [
    { label: 'Photos', value: `${profile.photos.length} uploaded` },
    { label: 'Location', value: `${profile.location.country || '-'} / ${profile.location.city || '-'}` },
    { label: 'Heritage', value: `${profile.heritage.country || '-'} / ${profile.heritage.tribe || '-'}` },
    { label: 'Personal', value: `${profile.personalDetails.height || '-'}, ${profile.personalDetails.bodyType || '-'}` },
    { label: 'Work', value: profile.work.occupation || '-' },
    { label: 'Faith', value: profile.faith || '-' },
    { label: 'Interests', value: profile.interests.length ? profile.interests.join(', ') : '-' },
    { label: 'Bio', value: profile.bio || '-' },
    { label: 'Looking for', value: profile.lookingFor || '-' },
    { label: 'ID Upload', value: profile.idVerification.url ? 'Provided' : 'Missing' },
    { label: 'Selfie', value: profile.selfiePhoto ? 'Provided' : 'Missing' },
  ];

  return (
    <View style={styles.reviewContainer}>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(currentStep / totalSteps) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>Step {currentStep} of {totalSteps}</Text>
      </View>

      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Svg width="24" height="24" viewBox="0 0 24 24">
            <Path d="M15 18L9 12L15 6" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.reviewTitle}>Review & Submit</Text>
        <TouchableOpacity onPress={onSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.reviewContent}>
        {rows.map((row) => (
          <View key={row.label} style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>{row.label}</Text>
            <Text style={styles.reviewValue}>{row.value}</Text>
          </View>
        ))}
        <Text style={styles.reviewHint}>Make sure each section looks good before submitting.</Text>
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.submitButton} onPress={onNext}>
          <LinearGradient colors={['#FF6B9D', '#F97316']} style={styles.submitGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.submitText}>Submit Profile</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

interface CompletionStepProps {
  onContinue: () => void;
}

const CompletionStep: React.FC<CompletionStepProps> = ({ onContinue }) => {
  return (
    <View style={styles.reviewContainer}>
      <View style={styles.successCard}>
        <Text style={styles.successTitle}>Profile Complete!</Text>
        <Text style={styles.successSubtitle}>You are all set. Head to the app to start connecting.</Text>
        <TouchableOpacity style={styles.submitButton} onPress={onContinue}>
          <LinearGradient colors={['#FF6B9D', '#F97316']} style={styles.submitGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.submitText}>Go to Home</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};
