import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from '@/utils/secureStore';
import { useAuthStore } from '@/store/authStore';
import { colors, typography, spacing } from '@/theme';

export default function SplashScreen() {
  const router = useRouter();
  const loadUser = useAuthStore((state) => state.loadUser);
  const loading = useAuthStore((state) => state.loading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();

    let cancelled = false;
    const MAX_SPLASH_MS = 3000;

    const bootstrap = async () => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (cancelled) return;

      if (token) {
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Splash timeout')), MAX_SPLASH_MS)
          );
          await Promise.race([loadUser(), timeoutPromise]);
          if (!cancelled) {
            router.replace('/(tabs)/home');
          }
        } catch (err) {
          // If refresh fails, go to welcome screen
          if (!cancelled) {
            router.replace('/(auth)/welcome');
          }
        }
        return;
      }

      if (!cancelled) {
        router.replace('/(auth)/welcome');
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [fadeAnim, scaleAnim, loadUser, router]);

  return (
    <LinearGradient colors={['#0A0A0A', '#1a0a2e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
      <View style={styles.container}>
        <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <Image source={require('../../assets/logop.webp')} style={styles.logoImage} resizeMode="contain" />
          <Text style={styles.appName}>TRIBAL MINGLE</Text>
          <Text style={styles.tagline}>Connect with Your Roots</Text>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoContainer: { alignItems: 'center' },
  logoImage: { width: 120, height: 120, marginBottom: spacing.lg },
  appName: { fontSize: 36, fontWeight: 'bold', letterSpacing: 2, marginBottom: spacing.sm, color: colors.text.primary },
  tagline: { fontSize: 18, color: colors.text.primary },
});
