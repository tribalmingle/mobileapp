import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import CustomInput from '@/components/CustomInput';
import PrimaryButton from '@/components/PrimaryButton';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '@/components/GlassCard';
import { useAuthStore } from '@/store/authStore';
import { colors, spacing, typography, borderRadius } from '@/theme';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');
const TOTAL_STEPS = 4;

// Step titles and subtitles for progressive UX
const STEP_CONTENT = [
  { title: "What's your email?", subtitle: "We'll send you a verification code" },
  { title: "What's your name?", subtitle: 'This is how you\'ll appear on your profile' },
  { title: 'Tell us about yourself', subtitle: 'Help us personalize your experience' },
  { title: 'Secure your account', subtitle: 'Create a strong password' },
];

export default function SignupScreen() {
  const router = useRouter();
  const { signup } = useAuthStore();
  
  // Step state
  const [currentStep, setCurrentStep] = useState(1);
  const progressAnim = useRef(new Animated.Value(1)).current;
  
  // Form fields
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  
  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  // Animate progress bar
  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: currentStep,
      tension: 50,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [currentStep, progressAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [1, TOTAL_STEPS],
    outputRange: ['25%', '100%'],
  });

  // Step validation
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 1:
        return email.trim() && validateEmail(email);
      case 2:
        return firstName.trim() && lastName.trim();
      case 3:
        return dateOfBirth && gender;
      case 4:
        return password.length >= 8;
      default:
        return false;
    }
  }, [currentStep, email, firstName, lastName, dateOfBirth, gender, password]);

  const handleNext = async () => {
    setErrorMessage('');
    
    // Validate current step
    switch (currentStep) {
      case 1:
        if (!validateEmail(email)) {
          return setErrorMessage('Please enter a valid email address');
        }
        break;
      case 2:
        if (!firstName.trim()) return setErrorMessage('Please enter your first name');
        if (!lastName.trim()) return setErrorMessage('Please enter your last name');
        break;
      case 3:
        if (!dateOfBirth) return setErrorMessage('Please select your date of birth');
        const age = calculateAge(dateOfBirth);
        if (age < 30) return setErrorMessage('You must be at least 30 years old to use this platform');
        if (!gender) return setErrorMessage('Please select your gender');
        break;
      case 4:
        if (password.length < 8) return setErrorMessage('Password must be at least 8 characters');
        break;
    }

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - submit
      await handleSignUp();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setErrorMessage('');
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const handleSignUp = async () => {
    if (!dateOfBirth) return;
    
    setLoading(true);
    try {
      const age = calculateAge(dateOfBirth);
      await signup({
        email: email.toLowerCase().trim(),
        password,
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        age,
        gender,
        dateOfBirth: dateOfBirth.toISOString().split('T')[0],
      });

      await SecureStore.setItemAsync('user_data', JSON.stringify({ name: `${firstName} ${lastName}`, email }));
      router.push({
        pathname: '/(auth)/otp-verification',
        params: { email: email.toLowerCase().trim() }
      });
    } catch (error: any) {
      if (error?.message?.includes('already')) {
        setErrorMessage('This email is already registered. Please login or use a different email.');
      } else {
        setErrorMessage(error?.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <CustomInput
              label=""
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
              editable={!loading}
            />
          </View>
        );
      
      case 2:
        return (
          <View style={styles.stepContent}>
            <CustomInput
              label="First Name"
              placeholder="Your first name"
              value={firstName}
              onChangeText={setFirstName}
              autoFocus
              editable={!loading}
            />
            <CustomInput
              label="Last Name"
              placeholder="Your last name"
              value={lastName}
              onChangeText={setLastName}
              editable={!loading}
            />
          </View>
        );
      
      case 3:
        return (
          <View style={styles.stepContent}>
            {/* Birthday */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Birthday</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
                disabled={loading}
              >
                <Ionicons name="calendar-outline" size={22} color={colors.text.primary} />
                <Text style={[styles.dateText, !dateOfBirth && styles.placeholder]}>
                  {dateOfBirth ? formatDate(dateOfBirth) : 'Select your birthday'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={colors.text.secondary} />
              </TouchableOpacity>
              {dateOfBirth && (
                <Text style={styles.ageHint}>
                  Age: {calculateAge(dateOfBirth)} years old
                </Text>
              )}
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={dateOfBirth || new Date(1990, 0, 1)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setDateOfBirth(selectedDate);
                  }
                }}
                maximumDate={new Date(new Date().getFullYear() - 30, 11, 31)}
                minimumDate={new Date(1930, 0, 1)}
              />
            )}

            {/* Gender */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderRow}>
                <TouchableOpacity
                  style={[styles.genderButton, gender === 'male' && styles.genderButtonActive]}
                  onPress={() => setGender('male')}
                  disabled={loading}
                >
                  <Ionicons
                    name="male"
                    size={28}
                    color={gender === 'male' ? colors.white : colors.text.primary}
                  />
                  <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>
                    Male
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.genderButton, gender === 'female' && styles.genderButtonActive]}
                  onPress={() => setGender('female')}
                  disabled={loading}
                >
                  <Ionicons
                    name="female"
                    size={28}
                    color={gender === 'female' ? colors.white : colors.text.primary}
                  />
                  <Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>
                    Female
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      
      case 4:
        return (
          <View style={styles.stepContent}>
            <View style={styles.passwordContainer}>
              <CustomInput
                label=""
                placeholder="Create a password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
                autoFocus
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={22}
                  color={colors.text.secondary}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.passwordRequirements}>
              <View style={styles.requirementRow}>
                <Ionicons
                  name={password.length >= 8 ? 'checkmark-circle' : 'ellipse-outline'}
                  size={18}
                  color={password.length >= 8 ? colors.success : colors.text.secondary}
                />
                <Text style={[styles.requirementText, password.length >= 8 && styles.requirementMet]}>
                  At least 8 characters
                </Text>
              </View>
            </View>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <LinearGradient colors={['#0A0A0A', '#1a0a2e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header with back button */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Progress indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { width: progressWidth }]}>
                <LinearGradient
                  colors={['#FF6B9D', '#F97316']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.progressGradient}
                />
              </Animated.View>
            </View>
            <View style={styles.stepIndicators}>
              {[1, 2, 3, 4].map((step) => (
                <View
                  key={step}
                  style={[
                    styles.stepDot,
                    step <= currentStep && styles.stepDotActive,
                    step < currentStep && styles.stepDotComplete,
                  ]}
                >
                  {step < currentStep ? (
                    <Ionicons name="checkmark" size={12} color={colors.white} />
                  ) : (
                    <Text style={[styles.stepNumber, step <= currentStep && styles.stepNumberActive]}>
                      {step}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Step content */}
          <GlassCard style={styles.card} intensity={20}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{STEP_CONTENT[currentStep - 1].title}</Text>
              <Text style={styles.subtitle}>{STEP_CONTENT[currentStep - 1].subtitle}</Text>
            </View>

            {renderStepContent()}

            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color={colors.error} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <PrimaryButton
              title={currentStep === TOTAL_STEPS ? 'Create Account' : 'Continue'}
              onPress={handleNext}
              loading={loading}
              disabled={loading || !canProceed}
              style={[styles.continueButton, !canProceed && styles.continueButtonDisabled]}
            />
          </GlassCard>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')} disabled={loading}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  signInLink: {
    ...typography.body,
    color: colors.secondary,
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: spacing.xl,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressGradient: {
    flex: 1,
    borderRadius: 2,
  },
  stepIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    borderColor: colors.orange.primary,
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
  },
  stepDotComplete: {
    backgroundColor: colors.orange.primary,
    borderColor: colors.orange.primary,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
  },
  stepNumberActive: {
    color: colors.orange.primary,
  },
  card: {
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  titleContainer: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  stepContent: {
    marginBottom: spacing.lg,
  },
  fieldContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass.medium,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.glass.stroke,
  },
  dateText: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
  },
  placeholder: {
    color: colors.text.secondary,
  },
  ageHint: {
    ...typography.small,
    color: colors.success,
    marginTop: spacing.xs,
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.glass.medium,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  genderButtonActive: {
    backgroundColor: colors.orange.primary,
    borderColor: colors.orange.dark,
  },
  genderText: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  genderTextActive: {
    color: colors.white,
  },
  passwordContainer: {
    position: 'relative',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: spacing.sm,
  },
  passwordRequirements: {
    marginTop: spacing.md,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  requirementText: {
    ...typography.small,
    color: colors.text.secondary,
  },
  requirementMet: {
    color: colors.success,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  errorText: {
    ...typography.small,
    color: colors.error,
    flex: 1,
  },
  continueButton: {
    marginTop: spacing.sm,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  footerText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  footerLink: {
    ...typography.body,
    color: colors.secondary,
    fontWeight: '700',
  },
});
