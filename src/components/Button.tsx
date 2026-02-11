import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, typography, theme } from '@/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  loading?: boolean;
  gradient?: readonly [string, string, ...string[]];
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  variant = 'primary',
  size = 'md',
  disabled = false,
  style,
  textStyle,
  loading = false,
  gradient,
}) => {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const shouldUseGradient = isPrimary && gradient && gradient.length >= 2;

  const sizeStyle = size === 'sm' ? styles.sm : size === 'md' ? styles.md : styles.lg;

  const variantStyle = isPrimary ? (shouldUseGradient ? styles.primaryTransparent : styles.primary) : isSecondary ? styles.secondary : styles.ghost;

  const textColorStyle = isPrimary ? styles.primaryText : isSecondary ? styles.secondaryText : styles.ghostText;

  const indicatorColor = isPrimary ? colors.text.primary : isSecondary ? colors.text.primary : colors.orange.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.base, sizeStyle, variantStyle, (disabled || loading) && styles.disabled, style]}
      activeOpacity={0.85}
    >
      {shouldUseGradient ? (
        <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.gradientFill, sizeStyle]}>
          {loading ? <ActivityIndicator size="small" color={indicatorColor} /> : <Text style={[textColorStyle, textStyle]}>{title}</Text>}
        </LinearGradient>
      ) : loading ? (
        <ActivityIndicator size="small" color={indicatorColor} />
      ) : (
        <Text style={[textColorStyle, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: theme.components.button.height.md,
    overflow: 'hidden',
  },
  primary: {
    backgroundColor: colors.gradient.primary[1],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryTransparent: {
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  secondary: {
    backgroundColor: colors.glass.medium,
    borderWidth: 1,
    borderColor: colors.glass.stroke,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  gradientFill: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sm: {
    paddingHorizontal: spacing.sm,
    height: theme.components.button.height.sm,
  },
  md: {
    paddingHorizontal: spacing.md,
    height: theme.components.button.height.md,
  },
  lg: {
    paddingHorizontal: spacing.lg,
    height: theme.components.button.height.lg,
  },
  primaryText: {
    color: colors.text.primary,
    fontSize: typography.styles.body.fontSize,
    fontWeight: '600',
    fontFamily: typography.fontFamily.sans,
  },
  secondaryText: {
    color: colors.text.primary,
    fontSize: typography.styles.body.fontSize,
    fontWeight: '600',
    fontFamily: typography.fontFamily.sans,
  },
  ghostText: {
    color: colors.orange.primary,
    fontSize: typography.styles.body.fontSize,
    fontWeight: '600',
    fontFamily: typography.fontFamily.sans,
  },
  disabled: {
    opacity: 0.6,
  },
});

export default Button;
