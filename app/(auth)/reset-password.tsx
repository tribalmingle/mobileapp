import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '@/components/GlassCard';
import CustomInput from '@/components/CustomInput';
import PrimaryButton from '@/components/PrimaryButton';
import { colors, spacing, typography } from '@/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/store/authStore';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const { resetPassword } = useAuthStore();
  const [token, setToken] = useState((params?.token as string) || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    if (!token.trim()) return setErrorMessage('Reset token is missing. Open the link from your email or paste the token.');
    if (!password) return setErrorMessage('Please enter a new password');
    if (password.length < 8) return setErrorMessage('Password must be at least 8 characters long');
    if (password !== confirmPassword) return setErrorMessage('Passwords do not match');

    setLoading(true);
    try {
      await resetPassword(token.trim(), password);
      setSuccessMessage('Password updated. You can now log in.');
      setTimeout(() => router.replace('/(auth)/login'), 600);
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Unable to reset password. Please try again.';
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

          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Create a new password for your account</Text>

          <GlassCard style={styles.card}>
            <CustomInput
              label="Reset Token"
              placeholder="Paste token from reset link"
              value={token}
              onChangeText={setToken}
              autoCapitalize="none"
              editable={!loading}
            />
            <CustomInput label="New Password" placeholder="Enter new password" value={password} onChangeText={setPassword} secureTextEntry editable={!loading} />
            <CustomInput
              label="Confirm Password"
              placeholder="Re-enter new password"
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

            {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

            <PrimaryButton title="Reset Password" onPress={handleReset} loading={loading} disabled={loading} />
          </GlassCard>
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
  errorContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: spacing.md, borderRadius: 8, marginBottom: spacing.lg },
  errorText: { ...typography.styles.body, color: colors.error, marginLeft: spacing.sm, flex: 1, fontFamily: typography.fontFamily.sans },
  successText: { ...typography.styles.body, color: colors.success, marginBottom: spacing.lg, fontFamily: typography.fontFamily.sans },
});
