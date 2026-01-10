import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import UniversalBackground from '@/components/universal/UniversalBackground';
import GlassCard from '@/components/GlassCard';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { fetchTips, Tip } from '@/api/tips';

export default function TipsScreen() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTips()
      .then((list) => setTips(list))
      .catch((err) => setError(err?.message || 'Could not load tips'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <UniversalBackground
      scrollable
      contentContainerStyle={styles.scrollContent}
      title="Dating Tips"
      showBottomNav
    >
      {loading ? <ActivityIndicator color={colors.secondary} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {tips.map((tip) => (
        <GlassCard key={tip.title} style={styles.card} intensity={26} padding={spacing.lg}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Guide</Text>
          </View>
          <Text style={styles.title}>{tip.title}</Text>
          <Text style={styles.body}>{tip.body}</Text>
        </GlassCard>
      ))}
    </UniversalBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  card: {
    gap: spacing.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondary,
  },
  badgeText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
  },
  body: {
    ...typography.body,
    color: colors.text.secondary,
  },
  error: {
    ...typography.body,
    color: colors.error,
  },
});
