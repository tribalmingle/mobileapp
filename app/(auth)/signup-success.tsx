import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import PrimaryButton from '@/components/PrimaryButton';
import { colors, spacing, typography } from '@/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function SignUpSuccessScreen() {
  const router = useRouter();

  return (
    <LinearGradient colors={['#0A0A0A', '#1a0a2e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-circle" size={72} color={colors.success} />
          </View>
          <Text style={styles.title}>Account Created!</Text>
          <Text style={styles.subtitle}>Your account has been created successfully. Let's set up your profile.</Text>

          <PrimaryButton title="Continue" onPress={() => router.replace('/(setup)')} />

          <TouchableOpacity style={styles.loginLink} onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.loginText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1, padding: spacing.screenPadding, justifyContent: 'center' },
  card: {
    padding: spacing.cardPaddingLarge,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  iconContainer: { marginBottom: spacing.lg },
  title: { ...typography.styles.h1, color: colors.text.primary, textAlign: 'center', marginBottom: spacing.sm, fontFamily: typography.fontFamily.display },
  subtitle: { ...typography.styles.body, color: colors.text.primary, textAlign: 'center', marginBottom: spacing.lg, fontFamily: typography.fontFamily.sans },
  loginLink: { marginTop: spacing.md },
  loginText: { ...typography.styles.button, color: colors.orange.primary, fontFamily: typography.fontFamily.sans },
});
