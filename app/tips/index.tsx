import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
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
        <TouchableOpacity 
          key={tip.id} 
          onPress={() => router.push(`/tips/${tip.id}`)}
          activeOpacity={0.8}
        >
          <GlassCard style={styles.card} intensity={26} padding={spacing.lg}>
            <View style={styles.cardHeader}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{tip.category}</Text>
              </View>
              <View style={styles.readTime}>
                <Feather name="clock" size={12} color={colors.text.muted} />
                <Text style={styles.readTimeText}>{tip.readingTime} min read</Text>
              </View>
            </View>
            <Text style={styles.title}>{tip.title}</Text>
            <Text style={styles.body} numberOfLines={3}>{tip.excerpt}</Text>
            <View style={styles.readMore}>
              <Text style={styles.readMoreText}>Read Article</Text>
              <Feather name="arrow-right" size={14} color={colors.secondary} />
            </View>
          </GlassCard>
        </TouchableOpacity>
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  readTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readTimeText: {
    ...typography.caption,
    color: colors.text.muted,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
  },
  body: {
    ...typography.body,
    color: colors.text.secondary,
  },
  readMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  readMoreText: {
    ...typography.caption,
    color: colors.secondary,
    fontWeight: '600',
  },
  error: {
    ...typography.body,
    color: colors.error,
  },
});
