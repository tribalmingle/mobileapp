import React from 'react';
import { TouchableOpacity, Text, StyleSheet, StyleProp, ViewStyle, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, borderRadius } from '@/theme';

type Variant = 'primary' | 'secondary';

interface GoldButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  variant?: Variant;
}

export default function GoldButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  style,
  variant = 'primary',
}: GoldButtonProps) {
  if (variant === 'secondary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        style={[styles.secondaryButton, style, (disabled || loading) && styles.disabled]}
        activeOpacity={0.85}
      >
        {loading ? <ActivityIndicator color={colors.text.primary} /> : <Text style={styles.secondaryText}>{title}</Text>}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.button, style, (disabled || loading) && styles.disabled]}
      activeOpacity={0.9}
    >
      <LinearGradient colors={gradients.gold.colors} start={gradients.gold.start} end={gradients.gold.end} style={styles.gradient}>
        {loading ? <ActivityIndicator color={colors.text.primary} /> : <Text style={styles.primaryText}>{title}</Text>}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    minHeight: 48,
  },
  gradient: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.4,
    color: colors.text.primary,
  },
  secondaryButton: {
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.secondary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.4,
    color: colors.text.primary,
  },
  disabled: {
    opacity: 0.6,
  },
});
