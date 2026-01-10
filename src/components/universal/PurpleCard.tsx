import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, borderRadius, shadows } from '@/theme';

interface PurpleCardProps {
  children: ReactNode;
  style?: ViewStyle;
  bleed?: boolean;
}

export default function PurpleCard({ children, style, bleed = false }: PurpleCardProps) {
  return (
    <View style={[bleed ? styles.bleedWrapper : styles.wrapper, style]}>
      <LinearGradient
        colors={gradients.deepMystic.colors}
        start={gradients.deepMystic.start}
        end={gradients.deepMystic.end}
        style={styles.card}
      >
        {children}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: borderRadius.xl,
    backgroundColor: colors.background,
    padding: 1,
  },
  bleedWrapper: {
    borderRadius: borderRadius.xl,
  },
  card: {
    borderRadius: borderRadius.xl,
    padding: 20,
    ...shadows.lg,
  },
});
