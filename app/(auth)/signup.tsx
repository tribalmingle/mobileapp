import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Modal, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import CustomInput from '@/components/CustomInput';
import PrimaryButton from '@/components/PrimaryButton';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '@/components/GlassCard';
import { useAuthStore } from '@/store/authStore';
import { colors, spacing, typography, borderRadius } from '@/theme';

export default function SignupScreen() {
  const router = useRouter();
  const { signup } = useAuthStore();
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [showMonthModal, setShowMonthModal] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showYearModal, setShowYearModal] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
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

  const months = useMemo(
    () => [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
    [],
  );

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const arr: string[] = [];
    for (let y = currentYear; y >= currentYear - 90; y--) {
      arr.push(String(y));
    }
    return arr;
  }, []);

  const daysInSelectedMonth = useMemo(() => {
    if (!selectedMonth || !selectedYear) return 31;
    const monthIndex = months.indexOf(selectedMonth);
    const yearNum = Number(selectedYear);
    return new Date(yearNum, monthIndex + 1, 0).getDate();
  }, [selectedMonth, selectedYear, months]);

  const dayOptions = useMemo(() => Array.from({ length: daysInSelectedMonth }, (_, i) => String(i + 1)), [daysInSelectedMonth]);

  const isDateSelected = Boolean(selectedMonth && selectedDay && selectedYear);

  useEffect(() => {
    if (!selectedDay) return;
    const dayNum = Number(selectedDay);
    if (dayNum > daysInSelectedMonth) {
      setSelectedDay(String(daysInSelectedMonth));
    }
  }, [daysInSelectedMonth, selectedDay]);

  const buildDate = () => {
    if (!isDateSelected) return null;
    const monthIndex = months.indexOf(selectedMonth as string);
    const dayNum = Number(selectedDay);
    const yearNum = Number(selectedYear);
    return new Date(yearNum, monthIndex, dayNum);
  };

  const handleSignUp = async () => {
    setErrorMessage('');
    if (!firstName.trim()) return setErrorMessage('Please enter your first name');
    if (!lastName.trim()) return setErrorMessage('Please enter your last name');
    if (!email.trim()) return setErrorMessage('Please enter your email');
    if (!validateEmail(email)) return setErrorMessage('Please enter a valid email address');
    const dob = buildDate();
    if (!dob) return setErrorMessage('Please select your date of birth');
    const age = calculateAge(dob);
    if (age < 30) return setErrorMessage('You must be at least 30 years old to use this platform');
    if (!gender) return setErrorMessage('Please select your gender');
    if (!password) return setErrorMessage('Please enter a password');
    if (password.length < 8) return setErrorMessage('Password must be at least 8 characters long');
    if (password !== confirmPassword) return setErrorMessage('Passwords do not match');

    setLoading(true);
    try {
      await signup({
        email: email.toLowerCase().trim(),
        password,
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        age,
        gender,
        dateOfBirth: dob.toISOString().split('T')[0],
      });

      await SecureStore.setItemAsync('user_data', JSON.stringify({ name: `${firstName} ${lastName}`, email }));
      router.push('/(auth)/otp-verification');
    } catch (error: any) {
      if (error?.message?.includes('already')) {
        setErrorMessage('This email is already registered. Please login or use a different email.');
      } else {
        const errorMsg = error?.message || 'Failed to create account. Please try again.';
        setErrorMessage(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0A0A0A', '#1a0a2e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <View style={styles.panel}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
            </TouchableOpacity>

            <View style={styles.headerContainer}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join TribalMingle to find your perfect match</Text>
            </View>

            <GlassCard style={styles.card}>
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <CustomInput label="First Name" placeholder="First name" value={firstName} onChangeText={setFirstName} editable={!loading} />
                </View>
                <View style={styles.halfInput}>
                  <CustomInput label="Last Name" placeholder="Last name" value={lastName} onChangeText={setLastName} editable={!loading} />
                </View>
              </View>
              <CustomInput label="Email" placeholder="your@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" editable={!loading} />

              <View style={styles.dateContainer}>
                <Text style={styles.label}>Birthday</Text>
                <View style={styles.dobRow}>
                  <TouchableOpacity style={styles.dobSelect} onPress={() => setShowMonthModal(true)} disabled={loading}>
                    <Text style={[styles.dobLabel, !selectedMonth && styles.dobPlaceholder]}>Month</Text>
                    <Text style={[styles.dobValue, !selectedMonth && styles.dobPlaceholder]}>{selectedMonth || 'Select'}</Text>
                    <Ionicons name="chevron-down" size={18} color={colors.text.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dobSelect} onPress={() => setShowDayModal(true)} disabled={loading}>
                    <Text style={[styles.dobLabel, !selectedDay && styles.dobPlaceholder]}>Day</Text>
                    <Text style={[styles.dobValue, !selectedDay && styles.dobPlaceholder]}>{selectedDay || 'Select'}</Text>
                    <Ionicons name="chevron-down" size={18} color={colors.text.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dobSelect} onPress={() => setShowYearModal(true)} disabled={loading}>
                    <Text style={[styles.dobLabel, !selectedYear && styles.dobPlaceholder]}>Year</Text>
                    <Text style={[styles.dobValue, !selectedYear && styles.dobPlaceholder]}>{selectedYear || 'Select'}</Text>
                    <Ionicons name="chevron-down" size={18} color={colors.text.primary} />
                  </TouchableOpacity>
                </View>
                {isDateSelected ? <Text style={styles.ageHint}>Age: {calculateAge(buildDate() as Date)} years old</Text> : null}
              </View>

              <View style={styles.genderContainer}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.genderButtons}>
                  <TouchableOpacity
                    style={[styles.genderButton, gender === 'male' && styles.genderButtonActive]}
                    onPress={() => setGender('male')}
                    disabled={loading}
                  >
                    <Ionicons name="male" size={24} color={colors.text.primary} />
                    <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>Male</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.genderButton, gender === 'female' && styles.genderButtonActive]}
                    onPress={() => setGender('female')}
                    disabled={loading}
                  >
                    <Ionicons name="female" size={24} color={colors.text.primary} />
                    <Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>Female</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <CustomInput label="Password" placeholder="Create a password (min 8 characters)" value={password} onChangeText={setPassword} secureTextEntry editable={!loading} />

              <CustomInput
                label="Confirm Password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!loading}
                error={confirmPassword.length > 0 && password !== confirmPassword ? 'Passwords do not match' : undefined}
              />

              {errorMessage ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={20} color={colors.error} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              <PrimaryButton title="Sign Up" onPress={handleSignUp} loading={loading} disabled={loading} style={styles.signUpButton} />

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/login')} disabled={loading}>
                  <Text style={styles.signInText}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </ScrollView>
        </View>

        <Modal visible={showMonthModal} transparent animationType="fade" onRequestClose={() => setShowMonthModal(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Month</Text>
              <ScrollView>
                {months.map((month) => (
                  <TouchableOpacity
                    key={month}
                    style={styles.modalOption}
                    onPress={() => {
                      setSelectedMonth(month);
                      setShowMonthModal(false);
                      if (!selectedDay) setSelectedDay('1');
                    }}
                  >
                    <Text style={styles.modalOptionText}>{month}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal visible={showDayModal} transparent animationType="fade" onRequestClose={() => setShowDayModal(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Day</Text>
              <ScrollView>
                {dayOptions.map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={styles.modalOption}
                    onPress={() => {
                      setSelectedDay(day);
                      setShowDayModal(false);
                    }}
                  >
                    <Text style={styles.modalOptionText}>{day}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal visible={showYearModal} transparent animationType="fade" onRequestClose={() => setShowYearModal(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Year</Text>
              <ScrollView>
                {years.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={styles.modalOption}
                    onPress={() => {
                      setSelectedYear(year);
                      setShowYearModal(false);
                    }}
                  >
                    <Text style={styles.modalOptionText}>{year}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  panel: { flex: 1, backgroundColor: 'transparent' },
  scrollContent: { flexGrow: 1, padding: spacing.screenPadding, paddingTop: 60 },
  backButton: { width: 40, height: 40, justifyContent: 'center', marginBottom: spacing.lg },
  headerContainer: { marginBottom: spacing['2xl'] },
  title: { ...typography.styles.h1, marginBottom: spacing.sm, fontFamily: typography.fontFamily.display, color: colors.text.primary },
  subtitle: { ...typography.styles.body, fontSize: 16, color: colors.text.primary, fontFamily: typography.fontFamily.sans },
  card: { padding: spacing.cardPaddingLarge },
  dateContainer: { marginBottom: spacing.lg },
  label: { ...typography.styles.label, marginBottom: spacing.sm, color: colors.text.primary, fontFamily: typography.fontFamily.sans },
  ageHint: { ...typography.styles.bodySmall, color: colors.text.primary, fontFamily: typography.fontFamily.sans, marginTop: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  halfInput: { flex: 1 },
  dobRow: { flexDirection: 'row', gap: spacing.sm },
  dobSelect: {
    flex: 1,
    backgroundColor: colors.glass.medium,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.glass.medium,
    gap: spacing.xs,
  },
  dobLabel: { ...typography.styles.bodySmall, color: colors.text.secondary, fontFamily: typography.fontFamily.sans },
  dobValue: { ...typography.styles.body, color: colors.text.primary, fontFamily: typography.fontFamily.sans },
  dobPlaceholder: { color: colors.text.secondary },
  genderContainer: { marginBottom: spacing.lg },
  genderButtons: { flexDirection: 'row', gap: spacing.md },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass.medium,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: spacing.sm,
  },
  genderButtonActive: { backgroundColor: colors.glass.light, borderColor: colors.orange.primary },
  genderText: { ...typography.styles.body, color: colors.text.primary, fontWeight: '600', fontFamily: typography.fontFamily.sans },
  genderTextActive: { color: colors.text.primary },
  signUpButton: { marginTop: spacing.md },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { ...typography.styles.body, color: colors.text.primary, fontFamily: typography.fontFamily.sans },
  signInText: { ...typography.styles.button, color: colors.text.primary, fontFamily: typography.fontFamily.sans },
  errorContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: spacing.md, borderRadius: 8, marginBottom: spacing.lg },
  errorText: { ...typography.styles.body, color: colors.error, marginLeft: spacing.sm, flex: 1, fontFamily: typography.fontFamily.sans },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: spacing.lg },
  modalContent: { backgroundColor: colors.glass.medium, borderRadius: borderRadius.lg, padding: spacing.lg, maxHeight: '70%' },
  modalTitle: { ...typography.styles.h4, color: colors.text.primary, marginBottom: spacing.md, fontFamily: typography.fontFamily.sans },
  modalOption: { paddingVertical: spacing.sm },
  modalOptionText: { ...typography.styles.body, color: colors.text.primary, fontFamily: typography.fontFamily.sans },
});
