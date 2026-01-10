import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import UniversalBackground from '@/components/universal/UniversalBackground';
import GlassCard from '@/components/GlassCard';
import GoldButton from '@/components/universal/GoldButton';
import { colors, spacing, typography } from '@/theme';
import {
  getGuaranteedDatingStatus,
  submitGuaranteedDating,
  requestGuaranteedRefund,
  submitGuaranteedFeedback,
  GuaranteedDatingStatus,
} from '@/api/guaranteedDating';

export default function GuaranteedDatingScreen() {
  const [status, setStatus] = useState<GuaranteedDatingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refreshStatus();
  }, []);

  const refreshStatus = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await getGuaranteedDatingStatus();
      setStatus(res);
    } catch (err: any) {
      setError(err?.message || 'Could not load guaranteed dating status');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const res = await submitGuaranteedDating({
        preferences: {
          city: 'Lagos',
          relationshipGoals: 'Marriage',
          interests: ['Food', 'Travel'],
          loveLanguages: ['Quality Time', 'Acts of Service'],
        },
        notes: 'Match me with someone who enjoys live music and dinner dates.',
      });
      setStatus(res);
      Alert.alert('Submitted', 'Your guaranteed dating request was sent.');
    } catch (err: any) {
      Alert.alert('Submit failed', err?.message || 'Could not submit request');
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!status?.requestId) return Alert.alert('Refund', 'No request to refund');
    try {
      setLoading(true);
      await requestGuaranteedRefund({ requestId: status.requestId, reason: 'No suitable match found' });
      Alert.alert('Refund requested', 'We are processing your refund.');
    } catch (err: any) {
      Alert.alert('Refund failed', err?.message || 'Could not request refund');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async () => {
    if (!status?.requestId) return Alert.alert('Feedback', 'No request to review');
    try {
      setLoading(true);
      await submitGuaranteedFeedback({ requestId: status.requestId, rating: 5, feedback: 'Great match', wentOnDate: true });
      Alert.alert('Thanks', 'Feedback submitted.');
    } catch (err: any) {
      Alert.alert('Feedback failed', err?.message || 'Could not send feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <UniversalBackground
      scrollable
      contentContainerStyle={styles.scrollContent}
      title="Guaranteed Dating"
      showBottomNav
    >
      {loading ? <ActivityIndicator color={colors.secondary} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <GlassCard style={styles.card} intensity={28} padding={spacing.lg}>
        <Text style={styles.title}>Your status</Text>
        <StatusRow icon="shield" label="Status" value={status?.status || 'Not requested'} />
        {status?.daysRemaining ? <StatusRow icon="time" label="Days remaining" value={`${status.daysRemaining} days`} /> : null}
        {status?.match?.name ? <StatusRow icon="person" label="Match" value={status.match.name} /> : null}
        {status?.match?.venue ? <StatusRow icon="location" label="Venue" value={status.match.venue} /> : null}
        {status?.match?.date ? <StatusRow icon="calendar" label="Date" value={status.match.date} /> : null}
        <View style={styles.actionsRow}>
          <GoldButton title="Refresh" variant="secondary" onPress={refreshStatus} />
          <GoldButton title="Request refund" variant="secondary" onPress={handleRefund} />
        </View>
      </GlassCard>

      <GlassCard style={styles.card} intensity={24} padding={spacing.lg}>
        <Text style={styles.title}>Submit preferences</Text>
        <Text style={styles.subtitle}>Tell us your dating goals and we will handle the rest.</Text>
        <GoldButton title="Send request" onPress={handleSubmit} />
      </GlassCard>

      <GlassCard style={styles.card} intensity={24} padding={spacing.lg}>
        <Text style={styles.title}>Leave feedback</Text>
        <Text style={styles.subtitle}>Share how the match went so we can improve.</Text>
        <GoldButton title="Send feedback" variant="secondary" onPress={handleFeedback} />
      </GlassCard>
    </UniversalBackground>
  );
}

const StatusRow = ({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) => (
  <View style={styles.statusRow}>
    <Ionicons name={icon} size={18} color={colors.secondary} />
    <Text style={styles.statusLabel}>{label}</Text>
    <Text style={styles.statusValue}>{value}</Text>
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statusLabel: {
    ...typography.body,
    color: colors.text.secondary,
    flex: 1,
  },
  statusValue: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  error: {
    ...typography.body,
    color: colors.error,
  },
});
