import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, borderRadius, shadows, spacing } from '@/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  padding?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, intensity = 20, padding = spacing.cardPadding }) => {
  return (
    <View style={[styles.container, style]}>
      <BlurView intensity={intensity} style={styles.blur}>
        <View style={[styles.content, { padding }]}>{children}</View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.card,
    overflow: 'hidden',
    backgroundColor: colors.glass.light,
    ...shadows.glass,
  },
  blur: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default GlassCard;
