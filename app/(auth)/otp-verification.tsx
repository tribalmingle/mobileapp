import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@/theme';
import PrimaryButton from '@/components/PrimaryButton';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '@/components/GlassCard';

const CODE_LENGTH = 4;

export default function OTPVerificationScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const hiddenInputRef = useRef<TextInput | null>(null);

  useEffect(() => {
    const focusTimeout = setTimeout(() => {
      hiddenInputRef.current?.focus();
    }, 250);
    return () => clearTimeout(focusTimeout);
  }, []);

  const refocus = () => {
    hiddenInputRef.current?.focus();
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleHiddenChange = (text: string) => {
    const sanitized = text.replace(/[^0-9]/g, '').slice(0, CODE_LENGTH);
    setCode(sanitized);
  };

  const handleVerify = () => {
    if (loading || verified) return;
    const isComplete = code.length === CODE_LENGTH;
    if (!isComplete) return;
    setLoading(true);
    setVerified(true);

    setTimeout(() => {
      setLoading(false);
      router.push('/(auth)/signup-success');
    }, 300);
  };

  // Auto-accept any 4-digit code in demo mode to avoid waiting for email
  useEffect(() => {
    const isComplete = code.length === CODE_LENGTH;
    if (isComplete && !loading && !verified) {
      handleVerify();
    }
  }, [code, loading, verified]);

  const handleResend = () => {
    setTimer(60);
    setCode('');
    setVerified(false);
    hiddenInputRef.current?.focus();
  };

  return (
    <LinearGradient colors={['#0A0A0A', '#1a0a2e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
            </TouchableOpacity>

            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.subtitle}>Enter the 4-digit code we sent to your email</Text>

            <GlassCard style={styles.card}>
              <TouchableOpacity onPress={refocus} onPressIn={refocus} activeOpacity={0.9}>
                <View style={styles.codeContainer}>
                  {Array.from({ length: CODE_LENGTH }).map((_, index) => {
                    const digit = code[index] ?? '';
                    const isActive = code.length === index;
                    return (
                      <View key={index} style={[styles.codeBox, isActive && styles.codeBoxActive]}>
                        <Text style={styles.codeText}>{digit}</Text>
                      </View>
                    );
                  })}
                </View>
              </TouchableOpacity>

              <TextInput
                ref={hiddenInputRef}
                value={code}
                onChangeText={handleHiddenChange}
                keyboardType="number-pad"
                inputMode="numeric"
                textContentType="none"
                autoComplete="off"
                importantForAutofill="no"
                autoCorrect={false}
                autoCapitalize="none"
                contextMenuHidden
                showSoftInputOnFocus
                selectionColor={colors.text.primary}
                cursorColor={colors.text.primary}
                keyboardAppearance="dark"
                maxLength={CODE_LENGTH}
                style={styles.hiddenInput}
                autoFocus
                editable={!loading}
                onBlur={refocus}
                onFocus={refocus}
              />

              <PrimaryButton title="Verify (Demo)" onPress={handleVerify} loading={loading} disabled={loading || code.length !== CODE_LENGTH} />

              <View style={styles.resendContainer}>
                <Text style={styles.resendText}>Didn't receive the code?</Text>
                <TouchableOpacity onPress={handleResend} disabled={timer > 0}>
                  <Text style={[styles.resendButton, timer > 0 && styles.resendDisabled]}>
                    {timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
                  </Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: spacing.screenPadding, paddingTop: 60, paddingBottom: spacing.xxl },
  backButton: { width: 40, height: 40, justifyContent: 'center', marginBottom: spacing.lg },
  title: { ...typography.styles.h1, color: colors.text.primary, marginBottom: spacing.xs, fontFamily: typography.fontFamily.display },
  subtitle: { ...typography.styles.body, color: colors.text.primary, marginBottom: spacing['2xl'], fontFamily: typography.fontFamily.sans },
  card: { padding: spacing.cardPaddingLarge, backgroundColor: 'rgba(0,0,0,0.55)' },
  codeContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg, gap: spacing.md },
  codeBox: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.text.primary,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBoxActive: { borderColor: '#d2c2ff' },
  codeText: { fontSize: 24, color: colors.text.primary, fontFamily: typography.fontFamily.display },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    opacity: 0.08,
    color: 'transparent',
  },
  resendContainer: { marginTop: spacing.lg, alignItems: 'center' },
  resendText: { ...typography.styles.body, color: colors.text.primary, marginBottom: spacing.xs, fontFamily: typography.fontFamily.sans },
  resendButton: { ...typography.styles.button, color: colors.text.primary, fontFamily: typography.fontFamily.sans },
  resendDisabled: { color: colors.text.primary, opacity: 0.5 },
});
