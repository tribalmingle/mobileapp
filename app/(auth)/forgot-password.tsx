import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '@/components/GlassCard';
import CustomInput from '@/components/CustomInput';
import PrimaryButton from '@/components/PrimaryButton';
import { colors, spacing, typography } from '@/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/store/authStore';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { forgotPassword } = useAuthStore();
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const CardWrapper = useMemo(() => (Platform.OS === 'web' ? GlassCard : View), []);

  const handleSubmit = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    if (!email.trim()) return setErrorMessage('Please enter your email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return setErrorMessage('Please enter a valid email address');

    setLoading(true);
    try {
      await forgotPassword(email.toLowerCase().trim());
      setSuccessMessage('Password reset link sent to your email');
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Unable to send reset link. Please try again.';
      setErrorMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0A0A0A', '#1a0a2e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <View style={styles.content}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>

          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>Enter your email to receive a reset link</Text>

          <CardWrapper style={Platform.OS === 'web' ? styles.card : styles.cardPlain}>
            <CustomInput
              label="Email"
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />

            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color={colors.error} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

            <PrimaryButton title="Send Reset Link" onPress={handleSubmit} loading={loading} disabled={loading} />
          </CardWrapper>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  content: { flex: 1, padding: spacing.screenPadding, paddingTop: 60 },
  backButton: { width: 40, height: 40, justifyContent: 'center', marginBottom: spacing.lg },
  title: { ...typography.styles.h1, color: colors.text.primary, marginBottom: spacing.xs, fontFamily: typography.fontFamily.display },
  subtitle: { ...typography.styles.body, color: colors.text.primary, marginBottom: spacing['2xl'], fontFamily: typography.fontFamily.sans },
  card: { padding: spacing.cardPaddingLarge },
  cardPlain: {
    padding: spacing.cardPaddingLarge,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  errorContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: spacing.md, borderRadius: 8, marginBottom: spacing.lg },
  errorText: { ...typography.styles.body, color: colors.error, marginLeft: spacing.sm, flex: 1, fontFamily: typography.fontFamily.sans },
  successText: { ...typography.styles.body, color: colors.success, marginBottom: spacing.lg, fontFamily: typography.fontFamily.sans },
});
