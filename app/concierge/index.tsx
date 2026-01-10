import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import UniversalBackground from '@/components/universal/UniversalBackground';
import GlassCard from '@/components/GlassCard';
import GoldButton from '@/components/universal/GoldButton';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { createConciergeRequest, fetchConciergeRequests, ConciergeRequest } from '@/api/concierge';

export default function ConciergeScreen() {
  const [requests, setRequests] = useState<ConciergeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConciergeRequests()
      .then((list) => setRequests(list))
      .catch((err) => setError(err?.message || 'Could not load concierge requests'))
      .finally(() => setLoading(false));
  }, []);

  const handleRequest = async () => {
    try {
      setLoading(true);
      const req = await createConciergeRequest({ preference: 'Plan my next date', notes: 'Dinner and a walk' });
      setRequests((prev) => [req, ...prev]);
    } catch (err: any) {
      Alert.alert('Concierge', err?.message || 'Could not submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <UniversalBackground
      scrollable
      contentContainerStyle={styles.scrollContent}
      title="Concierge"
      showBottomNav
    >
      {loading ? <ActivityIndicator color={colors.secondary} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <GlassCard style={styles.card} intensity={28} padding={spacing.lg}>
        <Text style={styles.title}>Date planning concierge</Text>
        <Text style={styles.subtitle}>Share your vibe, we handle venue, timing, and follow-ups.</Text>
        <View style={styles.tagRow}>
          <Tag icon="calendar" label="Plan a date" />
          <Tag icon="sparkles" label="Guaranteed dating" />
          <Tag icon="chatbubbles" label="Concierge chat" />
        </View>
        <GoldButton title="Message concierge" onPress={handleRequest} />
      </GlassCard>

      <GlassCard style={styles.card} intensity={24} padding={spacing.lg}>
        <Text style={styles.title}>Upcoming plans</Text>
        {requests.map((req) => (
          <View key={req.id} style={styles.planRow}>
            <Ionicons name="location" size={18} color={colors.secondary} />
            <View style={styles.meta}>
              <Text style={styles.planTitle}>{req.preference || 'Concierge request'}</Text>
              <Text style={styles.planCopy}>{req.status || 'Pending'}</Text>
            </View>
            <TouchableOpacity style={styles.link}>
              <Ionicons name="chevron-forward" size={18} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
        ))}
      </GlassCard>
    </UniversalBackground>
  );
}

const Tag = ({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) => (
  <View style={styles.tag}>
    <Ionicons name={icon} size={14} color={colors.primaryDark} />
    <Text style={styles.tagText}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  card: {
    gap: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.full,
  },
  tagText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  meta: {
    flex: 1,
    gap: 2,
  },
  planTitle: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '700',
  },
  planCopy: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  link: {
    padding: spacing.sm,
  },
  error: {
    ...typography.body,
    color: colors.error,
  },
});
