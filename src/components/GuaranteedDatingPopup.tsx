import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '@/theme';
import * as SecureStore from '@/utils/secureStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const POPUP_STORAGE_KEY = 'guaranteed_dating_popup_last_shown';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

interface GuaranteedDatingPopupProps {
  forceShow?: boolean; // For testing
}

export default function GuaranteedDatingPopup({ forceShow }: GuaranteedDatingPopupProps) {
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
        // Small delay so it doesn't interrupt app launch
        setTimeout(() => showPopup(), 2000);
      }
    } catch (error) {
      console.log('Error checking popup status:', error);
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
      // Save the timestamp
      await SecureStore.setItemAsync(POPUP_STORAGE_KEY, Date.now().toString());
    });
  };

  const handleLearnMore = async () => {
    await SecureStore.setItemAsync(POPUP_STORAGE_KEY, Date.now().toString());
    setVisible(false);
    router.push('/guaranteed-dating');
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
            colors={['#1a1a2e', '#16213e', '#0f0f23']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.popup}
          >
            {/* Close button */}
            <TouchableOpacity style={styles.closeBtn} onPress={hidePopup}>
              <Ionicons name="close" size={24} color={colors.text.tertiary} />
            </TouchableOpacity>

            {/* Decorative hearts */}
            <View style={styles.heartsContainer}>
              <Ionicons name="heart" size={24} color="rgba(255,107,157,0.3)" style={styles.heart1} />
              <Ionicons name="heart" size={16} color="rgba(255,215,0,0.4)" style={styles.heart2} />
              <Ionicons name="heart" size={20} color="rgba(166,77,255,0.3)" style={styles.heart3} />
            </View>

            {/* Main icon */}
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['rgba(255,107,157,0.8)', 'rgba(166,77,255,0.8)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradient}
              >
                <Ionicons name="heart" size={40} color="#fff" />
              </LinearGradient>
            </View>

            {/* Content */}
            <Text style={styles.title}>Tired of Swiping?</Text>
            <Text style={styles.subtitle}>
              Let us find your perfect match and plan your first date.
            </Text>

            {/* Price badge */}
            <View style={styles.priceBadge}>
              <Text style={styles.priceText}>$100</Text>
              <Text style={styles.priceSubtext}>Date in 30 days or full refund</Text>
            </View>

            {/* Features */}
            <View style={styles.features}>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={styles.featureText}>Hand-picked matches</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={styles.featureText}>We plan everything</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={styles.featureText}>100% money-back guarantee</Text>
              </View>
            </View>

            {/* CTA Button */}
            <TouchableOpacity style={styles.ctaButton} onPress={handleLearnMore}>
              <LinearGradient
                colors={[colors.secondary, '#f5c518']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaGradient}
              >
                <Text style={styles.ctaText}>Find My Match</Text>
                <Ionicons name="arrow-forward" size={20} color={colors.primaryDark} />
              </LinearGradient>
            </TouchableOpacity>

            {/* Dismiss link */}
            <TouchableOpacity onPress={hidePopup} style={styles.dismissLink}>
              <Text style={styles.dismissText}>Maybe later</Text>
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
    borderColor: 'rgba(255,255,255,0.1)',
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
  },
  heartsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  heart1: {
    position: 'absolute',
    top: 20,
    left: 30,
  },
  heart2: {
    position: 'absolute',
    top: 40,
    right: 40,
  },
  heart3: {
    position: 'absolute',
    top: 60,
    left: 60,
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
    shadowColor: '#ff6b9d',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  title: {
    fontSize: 26,
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
    marginBottom: spacing.lg,
  },
  priceBadge: {
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  priceText: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.secondary,
  },
  priceSubtext: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  features: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    ...typography.body,
    color: colors.text.secondary,
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
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  dismissLink: {
    padding: spacing.sm,
  },
  dismissText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
});
