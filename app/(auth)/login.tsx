import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import CustomInput from '@/components/CustomInput';
import PrimaryButton from '@/components/PrimaryButton';
import GlassCard from '@/components/GlassCard';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/store/authStore';
import { colors, spacing, typography } from '@/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login: authLogin } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleLogin = async () => {
    setErrorMessage('');
    if (!email.trim()) return setErrorMessage('Please enter your email');
    if (!validateEmail(email)) return setErrorMessage('Please enter a valid email address');
    if (!password) return setErrorMessage('Please enter your password');

    setLoading(true);
    try {
      await authLogin(email.toLowerCase().trim(), password);
      if (rememberMe) {
        await SecureStore.setItemAsync('saved_email', email);
      }
      router.replace('/(tabs)/home');
    } catch (error: any) {
      const errorMsg = error?.message || 'Invalid email or password';
      setErrorMessage(errorMsg);
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
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to continue your journey</Text>
            </View>

            <GlassCard style={styles.card}>
              <CustomInput
                label="Email"
                placeholder="your@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />

              <CustomInput
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />

              <View style={styles.optionsRow}>
                <TouchableOpacity style={styles.rememberMeContainer} onPress={() => setRememberMe(!rememberMe)} activeOpacity={0.7}>
                  <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                    {rememberMe && <Ionicons name="checkmark" size={16} color={colors.text.primary} />}
                  </View>
                  <Text style={styles.rememberMeText}>Remember Me</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} disabled={loading}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              {errorMessage ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={20} color={colors.error} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              <PrimaryButton title="Log In" onPress={handleLogin} loading={loading} disabled={loading} style={styles.loginButton} />

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/signup')} disabled={loading}>
                  <Text style={styles.signUpText}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </ScrollView>
        </View>
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
  optionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  rememberMeContainer: { flexDirection: 'row', alignItems: 'center' },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: colors.neutral.gray[400], justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm },
  checkboxChecked: { backgroundColor: colors.orange.primary, borderColor: colors.orange.primary },
  rememberMeText: { ...typography.styles.body, color: colors.text.primary, fontFamily: typography.fontFamily.sans },
  forgotPasswordText: { ...typography.styles.button, color: colors.text.primary, fontFamily: typography.fontFamily.sans, fontSize: 14 },
  errorContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: spacing.md, borderRadius: 8, marginBottom: spacing.lg },
  errorText: { ...typography.styles.body, color: colors.error, marginLeft: spacing.sm, flex: 1, fontFamily: typography.fontFamily.sans },
  loginButton: { marginBottom: spacing.lg },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.glass.medium },
  dividerText: { ...typography.styles.body, color: colors.text.primary, fontFamily: typography.fontFamily.sans, marginHorizontal: spacing.md },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { ...typography.styles.body, color: colors.text.primary, fontFamily: typography.fontFamily.sans },
  signUpText: { ...typography.styles.button, color: colors.text.primary, fontFamily: typography.fontFamily.sans },
});
