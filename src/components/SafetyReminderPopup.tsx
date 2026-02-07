import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '@/theme';
import * as SecureStore from '@/utils/secureStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const POPUP_STORAGE_KEY = 'safety_reminder_popup_last_shown';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
// Show 1 hour after guaranteed dating popup (which shows at ~2s after launch)
const SAFETY_DELAY_MS = 60 * 60 * 1000; // 1 hour

interface SafetyReminderPopupProps {
  forceShow?: boolean;
}

export default function SafetyReminderPopup({ forceShow }: SafetyReminderPopupProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkAndShowPopup();
  }, []);

  const checkAndShowPopup = async () => {
    if (forceShow) {
      showPopup();
      return;
    }

    try {
      const lastShown = await SecureStore.getItemAsync(POPUP_STORAGE_KEY);
      const now = Date.now();

      if (!lastShown || now - parseInt(lastShown) > ONE_DAY_MS) {
        // Show 1 hour after app launch
        setTimeout(() => showPopup(), SAFETY_DELAY_MS);
      }
    } catch (error) {
      console.log('Error checking safety popup status:', error);
    }
  };

  const showPopup = () => {
    setVisible(true);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hidePopup = async () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(async () => {
      setVisible(false);
      await SecureStore.setItemAsync(POPUP_STORAGE_KEY, Date.now().toString());
    });
  };

  const handleGoToSafety = async () => {
    await SecureStore.setItemAsync(POPUP_STORAGE_KEY, Date.now().toString());
    setVisible(false);
    router.push('/safety');
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={hidePopup}
    >
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <BlurView intensity={40} style={styles.blurOverlay}>
          <TouchableOpacity style={styles.backdropTouchable} onPress={hidePopup} activeOpacity={1} />
        </BlurView>

        <Animated.View style={[styles.popupContainer, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient
            colors={['#0f2027', '#1a1a2e', '#0f0f23']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.popup}
          >
            {/* Close button */}
            <TouchableOpacity style={styles.closeBtn} onPress={hidePopup}>
              <Ionicons name="close" size={24} color={colors.text.tertiary} />
            </TouchableOpacity>

            {/* Decorative shields */}
            <View style={styles.decorContainer}>
              <Ionicons name="shield" size={20} color="rgba(34, 197, 94, 0.25)" style={styles.decor1} />
              <Ionicons name="eye-off" size={16} color="rgba(251, 191, 36, 0.3)" style={styles.decor2} />
              <Ionicons name="shield-checkmark" size={18} color="rgba(124, 58, 237, 0.25)" style={styles.decor3} />
            </View>

            {/* Main icon */}
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['rgba(34, 197, 94, 0.8)', 'rgba(22, 163, 74, 0.9)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradient}
              >
                <Ionicons name="shield-checkmark" size={40} color="#fff" />
              </LinearGradient>
            </View>

            {/* Content */}
            <Text style={styles.title}>Stay Safe 🛡️</Text>
            <Text style={styles.subtitle}>
              Your safety is our priority. Be careful when chatting with users who haven't verified their identity.
            </Text>

            {/* Warning card */}
            <View style={styles.warningCard}>
              <View style={styles.warningRow}>
                <Ionicons name="warning" size={18} color="#FBBF24" />
                <Text style={styles.warningText}>
                  Unverified users have not confirmed their identity. Always exercise caution.
                </Text>
              </View>
            </View>

            {/* Safety tips */}
            <View style={styles.tips}>
              <View style={styles.tipRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={styles.tipText}>Look for the verified badge on profiles</Text>
              </View>
              <View style={styles.tipRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={styles.tipText}>Never share financial information</Text>
              </View>
              <View style={styles.tipRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={styles.tipText}>Meet in public places for first dates</Text>
              </View>
              <View style={styles.tipRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={styles.tipText}>Report suspicious behavior immediately</Text>
              </View>
            </View>

            {/* CTA Button */}
            <TouchableOpacity style={styles.ctaButton} onPress={handleGoToSafety}>
              <LinearGradient
                colors={['#22C55E', '#16A34A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaGradient}
              >
                <Ionicons name="shield-checkmark" size={20} color="#FFF" />
                <Text style={styles.ctaText}>Safety Center</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Dismiss */}
            <TouchableOpacity onPress={hidePopup} style={styles.dismissLink}>
              <Text style={styles.dismissText}>I understand, dismiss</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  popupContainer: {
    width: SCREEN_WIDTH - spacing.xl * 2,
    maxWidth: 360,
  },
  popup: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  decorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  decor1: {
    position: 'absolute',
    top: 20,
    left: 30,
  },
  decor2: {
    position: 'absolute',
    top: 45,
    right: 45,
  },
  decor3: {
    position: 'absolute',
    top: 65,
    left: 65,
  },
  iconContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  warningCard: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
    marginBottom: spacing.md,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  warningText: {
    ...typography.caption,
    color: '#FBBF24',
    flex: 1,
    lineHeight: 20,
  },
  tips: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tipText: {
    ...typography.body,
    color: colors.text.secondary,
    flex: 1,
  },
  ctaButton: {
    alignSelf: 'stretch',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
  },
  dismissLink: {
    padding: spacing.sm,
  },
  dismissText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
});
