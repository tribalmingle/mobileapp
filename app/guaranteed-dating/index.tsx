import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import UniversalBackground from '@/components/universal/UniversalBackground';
import GlassCard from '@/components/GlassCard';
import GoldButton from '@/components/universal/GoldButton';
import { colors, spacing, typography, borderRadius } from '@/theme';
import {
  getGuaranteedDatingStatus,
  submitGuaranteedDating,
  requestGuaranteedRefund,
  submitGuaranteedFeedback,
  GuaranteedDatingStatus,
} from '@/api/guaranteedDating';

const benefits = [
  { icon: 'shield-checkmark', title: 'Hand-Picked Matches', desc: 'Our team personally selects compatible partners based on your values and goals.' },
  { icon: 'heart', title: 'Real Dates, Guaranteed', desc: 'Within 90 days, go on a real date—or get your money back. No questions asked.' },
  { icon: 'calendar', title: 'We Handle Everything', desc: 'From finding your match to planning the perfect first date. Just show up.' },
  { icon: 'chatbubbles', title: 'Personal Matchmaker', desc: 'A dedicated matchmaker guides your journey, offering feedback and support.' },
];

export default function GuaranteedDatingScreen() {
  const [status, setStatus] = useState<GuaranteedDatingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

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
      setError(err?.message || 'Could not load status');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const res = await submitGuaranteedDating({
        preferences: {},
        notes: notes || "I'm ready to meet someone special.",
      });
      setStatus(res);
      Alert.alert('Request Submitted', 'Our matchmaking team will review your profile and reach out within 48 hours.');
    } catch (err: any) {
      Alert.alert('Submission Failed', err?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!status?.requestId) return Alert.alert('Refund', 'No active request found.');
    Alert.alert(
      'Request Refund',
      "If we haven't delivered a date within 90 days, you're entitled to a full refund. Continue?",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Refund',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await requestGuaranteedRefund({ requestId: status.requestId!, reason: 'Did not receive a match within 90 days' });
              Alert.alert('Refund Initiated', "Your refund is being processed. You'll receive confirmation within 5 business days.");
              refreshStatus();
            } catch (err: any) {
              Alert.alert('Refund Failed', err?.message || 'Please contact support.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleFeedback = async () => {
    if (!status?.requestId) return Alert.alert('Feedback', 'Complete a date first to leave feedback.');
    Alert.prompt(
      'How did it go?',
      'Share how your date went so we can continue improving.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async (feedback: string | undefined) => {
            try {
              setLoading(true);
              await submitGuaranteedFeedback({
                requestId: status.requestId!,
                rating: 5,
                feedback: feedback || 'Great experience!',
                wentOnDate: true,
              });
              Alert.alert('Thank You', 'Your feedback helps us create better matches for everyone.');
            } catch (err: any) {
              Alert.alert('Failed', err?.message || 'Could not submit feedback.');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      'plain-text',
      'It was a wonderful experience!'
    );
  };

  const hasActiveRequest = status?.status && status.status !== 'Not requested' && status.status !== 'none';

  return (
    <UniversalBackground
      scrollable
      contentContainerStyle={styles.scrollContent}
      title="Guaranteed Dating"
      showBottomNav
    >
      {/* Hero Section */}
      <GlassCard style={styles.heroCard} intensity={32} padding={spacing.xl}>
        <LinearGradient
          colors={['rgba(255,107,157,0.15)', 'rgba(166,77,255,0.08)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        />
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>A Real Date.{'\n'}Guaranteed.</Text>
          <Text style={styles.heroSubtitle}>
            Stop swiping. Start dating. We personally match you with compatible partners and plan your first date. 
            If you don't go on a real date within 90 days, get a full refund.
          </Text>
          <View style={styles.trustBadge}>
            <Ionicons name="shield-checkmark" size={16} color={colors.success} />
            <Text style={styles.trustText}>100% Money-Back Guarantee</Text>
          </View>
        </View>
      </GlassCard>

      {/* Benefits */}
      <View style={styles.benefitsGrid}>
        {benefits.map((b) => (
          <View key={b.title} style={styles.benefitItem}>
            <View style={styles.benefitIcon}>
              <Ionicons name={b.icon as any} size={24} color={colors.secondary} />
            </View>
            <Text style={styles.benefitTitle}>{b.title}</Text>
            <Text style={styles.benefitDesc}>{b.desc}</Text>
          </View>
        ))}
      </View>

      {/* Status Card (if active) */}
      {hasActiveRequest && (
        <GlassCard style={styles.card} intensity={28} padding={spacing.lg}>
          <View style={styles.statusHeader}>
            <Ionicons name="time" size={20} color={colors.secondary} />
            <Text style={styles.statusTitle}>Your Matchmaking Status</Text>
          </View>
          <View style={styles.statusContent}>
            <StatusRow icon="checkmark-circle" label="Request Status" value={status?.status || 'Processing'} />
            {status?.daysRemaining ? (
              <StatusRow icon="calendar" label="Days Remaining" value={`${status.daysRemaining} days`} />
            ) : null}
            {status?.match?.name ? (
              <>
                <View style={styles.matchDivider} />
                <Text style={styles.matchLabel}>Your Match</Text>
                <StatusRow icon="person" label="Name" value={status.match.name} />
                {status.match.venue ? <StatusRow icon="location" label="Venue" value={status.match.venue} /> : null}
                {status.match.date ? <StatusRow icon="calendar" label="Date" value={status.match.date} /> : null}
              </>
            ) : null}
          </View>
          <View style={styles.actionsRow}>
            <GoldButton title="Refresh Status" variant="secondary" onPress={refreshStatus} style={styles.actionBtn} />
            {status?.match?.name && (
              <GoldButton title="Leave Feedback" variant="secondary" onPress={handleFeedback} style={styles.actionBtn} />
            )}
            <GoldButton title="Request Refund" variant="secondary" onPress={handleRefund} style={styles.actionBtn} />
          </View>
        </GlassCard>
      )}

      {/* Request Form */}
      {!hasActiveRequest && (
        <GlassCard style={styles.card} intensity={24} padding={spacing.lg}>
          <Text style={styles.formTitle}>Ready to Find Your Person?</Text>
          <Text style={styles.formSubtitle}>
            Tell us about who you're looking for. Our matchmakers will review your profile and start searching for your ideal partner.
          </Text>
          <TextInput
            style={styles.notesInput}
            placeholder="What matters most to you in a partner? (Optional)"
            placeholderTextColor={colors.text.tertiary}
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
          />
          <GoldButton 
            title="Start My Matchmaking" 
            onPress={handleSubmit} 
            disabled={loading}
          />
          <Text style={styles.disclaimer}>
            Currently free during our launch period. No payment required.
          </Text>
        </GlassCard>
      )}

      {/* How It Works */}
      <GlassCard style={styles.card} intensity={20} padding={spacing.lg}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <View style={styles.stepsContainer}>
          <Step number={1} title="Submit Request" desc="Share your preferences and dating goals with us." />
          <Step number={2} title="We Find Your Match" desc="Our team handpicks compatible partners from our verified community." />
          <Step number={3} title="Date Planning" desc="We coordinate schedules and plan a memorable first date." />
          <Step number={4} title="Go On Your Date" desc="Show up on the date. No awkward messaging, no ghosting—just real connection." />
        </View>
      </GlassCard>

      {loading && <ActivityIndicator color={colors.secondary} style={styles.loader} />}
      {error && <Text style={styles.error}>{error}</Text>}
    </UniversalBackground>
  );
}

const Step = ({ number, title, desc }: { number: number; title: string; desc: string }) => (
  <View style={styles.step}>
    <View style={styles.stepNumber}>
      <Text style={styles.stepNumberText}>{number}</Text>
    </View>
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepDesc}>{desc}</Text>
    </View>
  </View>
);

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
  heroCard: {
    overflow: 'hidden',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: borderRadius.lg,
  },
  heroContent: {
    gap: spacing.md,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text.primary,
    lineHeight: 38,
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(16,185,129,0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  trustText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  benefitItem: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,215,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTitle: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  benefitDesc: {
    fontSize: 12,
    color: colors.text.tertiary,
    lineHeight: 16,
  },
  card: {
    gap: spacing.md,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusTitle: {
    ...typography.h4,
    color: colors.text.primary,
  },
  statusContent: {
    gap: spacing.xs,
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
  matchDivider: {
    height: 1,
    backgroundColor: colors.glass.stroke,
    marginVertical: spacing.sm,
  },
  matchLabel: {
    ...typography.caption,
    color: colors.secondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    minWidth: 100,
  },
  formTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  formSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  notesInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text.primary,
    ...typography.body,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  disclaimer: {
    ...typography.caption,
    color: colors.success,
    textAlign: 'center',
    fontWeight: '600',
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  stepsContainer: {
    gap: spacing.md,
  },
  step: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
    gap: 2,
  },
  stepTitle: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '700',
  },
  stepDesc: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  loader: {
    marginTop: spacing.lg,
  },
  error: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
  },
});
