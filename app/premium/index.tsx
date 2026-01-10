import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import UniversalBackground from '@/components/universal/UniversalBackground';
import GlassCard from '@/components/GlassCard';
import GoldButton from '@/components/universal/GoldButton';
import { colors, spacing, typography } from '@/theme';
import { fetchBoostSummary, fetchBoostWindows, activateBoost } from '@/api/boosts';
import { fetchReferralCode, fetchReferralProgress } from '@/api/referrals';

const plans = [
  { name: 'Premium Plus', price: '$29/mo', perks: ['See who liked you', '5 weekly boosts', 'Super likes x3'] },
  { name: 'Guardian', price: '$49/mo', perks: ['Guaranteed date planning', 'Concierge chat', 'Weekly spotlight'] },
  { name: 'Concierge', price: '$89/mo', perks: ['White-glove planning', 'Priority support', 'Exclusive events'] },
];

export default function PremiumScreen() {
  const router = useRouter();
  const [boosts, setBoosts] = useState<{ remaining: number; active: boolean } | null>(null);
  const [windows, setWindows] = useState<string[]>([]);
  const [loadingBoosts, setLoadingBoosts] = useState(true);
  const [referralStats, setReferralStats] = useState<{ completed: number; pending: number; code?: string; shareUrl?: string } | null>(null);
  const [loadingReferrals, setLoadingReferrals] = useState(true);

  useEffect(() => {
    fetchBoostSummary()
      .then((data) => setBoosts({ remaining: data.remaining ?? 0, active: !!data.active }))
      .catch(() => {})
      .finally(() => setLoadingBoosts(false));

    fetchBoostWindows()
      .then((data) => setWindows((data || []).map((w) => w.start || w.end || '')))
      .catch(() => {});

    fetchReferralProgress()
      .then((data) =>
        setReferralStats({
          completed: data.successfulReferrals || 0,
          pending: data.pendingReferrals || 0,
          code: data.code,
        }),
      )
      .catch(() => {})
      .finally(() => setLoadingReferrals(false));
    fetchReferralCode()
      .then((data) =>
        setReferralStats((prev) => ({
          completed: prev?.completed || 0,
          pending: prev?.pending || 0,
          code: data?.code || prev?.code,
          shareUrl: data?.shareUrl || prev?.shareUrl,
        })),
      )
      .catch(() => {});
  }, []);

  const handleBoost = async () => {
    try {
      setLoadingBoosts(true);
      const res = await activateBoost();
      setBoosts({ remaining: res?.remaining ?? boosts?.remaining ?? 0, active: res?.active ?? false });
    } catch (err: any) {
      Alert.alert('Boost', err?.message || 'Could not activate boost');
    } finally {
      setLoadingBoosts(false);
    }
  };

  const handleShare = async () => {
    try {
      const codeData = await fetchReferralCode();
      const code = codeData.code || referralStats?.code || 'YOURCODE';
      const link = codeData.shareUrl || referralStats?.shareUrl || 'https://tribalmingle.app/invite';
      await Share.share({ message: `Join me on Tribal Mingle with my code ${code}: ${link}` });
    } catch (err: any) {
      Alert.alert('Share invite', err?.message || 'Could not share invite');
    }
  };

  return (
    <UniversalBackground
      scrollable
      contentContainerStyle={styles.scrollContent}
      title="Premium & Boosts"
      showBottomNav
    >
      {plans.map((plan) => (
        <GlassCard key={plan.name} style={styles.card} intensity={30} padding={spacing.lg}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{plan.name}</Text>
            <Text style={styles.price}>{plan.price}</Text>
          </View>
          <View style={styles.perkList}>
            {plan.perks.map((perk) => (
              <View key={perk} style={styles.perkRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.secondary} />
                <Text style={styles.perkText}>{perk}</Text>
              </View>
            ))}
          </View>
          <GoldButton title="Upgrade" onPress={() => {}} />
        </GlassCard>
      ))}

      <GlassCard style={styles.card} intensity={24} padding={spacing.lg}>
        <Text style={styles.title}>Boosts & Spotlight</Text>
        <Text style={styles.subtitle}>Use boosts to climb the stack and spotlight to stay on top for 30 minutes.</Text>
        {loadingBoosts ? <ActivityIndicator color={colors.secondary} /> : null}
        {boosts ? (
          <View style={styles.boostRow}>
            <Ionicons name="flash" size={18} color={colors.secondary} />
            <Text style={styles.perkText}>
              {boosts.remaining} remaining • {boosts.active ? 'Active now' : 'Inactive'}
            </Text>
          </View>
        ) : null}
        {windows.filter(Boolean).length ? <Text style={styles.subtitle}>Best windows: {windows.filter(Boolean).join(', ')}</Text> : null}
        <GoldButton title="Use a boost" onPress={handleBoost} />
        <GoldButton title="Spotlight windows" variant="secondary" onPress={() => router.push('/boosts')} />
      </GlassCard>

      <GlassCard style={styles.card} intensity={24} padding={spacing.lg}>
        <Text style={styles.title}>Priority support & concierge</Text>
        <Text style={styles.subtitle}>Message the concierge for date planning, guarantees, and premium assistance.</Text>
        <View style={styles.badgeRow}>
          <Badge label="Concierge" />
          <Badge label="Guaranteed dating" />
          <Badge label="Expedited help" />
        </View>
        <GoldButton title="Open concierge" variant="secondary" onPress={() => router.push('/concierge')} />
      </GlassCard>

      <GlassCard style={styles.card} intensity={24} padding={spacing.lg}>
        <Text style={styles.title}>Guaranteed dating</Text>
        <Text style={styles.subtitle}>Track your guaranteed date status or send preferences to our team.</Text>
        <GoldButton title="View status" variant="secondary" onPress={() => router.push('/guaranteed-dating')} />
      </GlassCard>

      <GlassCard style={styles.card} intensity={22} padding={spacing.lg}>
        <Text style={styles.title}>Referrals</Text>
        <Text style={styles.subtitle}>Invite friends and unlock rewards when they subscribe.</Text>
        {loadingReferrals ? <ActivityIndicator color={colors.secondary} /> : null}
        {referralStats ? (
          <View style={styles.boostRow}>
            <Ionicons name="gift" size={18} color={colors.secondary} />
            <Text style={styles.perkText}>
              {referralStats.completed} completed • {referralStats.pending} pending
            </Text>
          </View>
        ) : null}
        {referralStats?.code ? <Text style={styles.subtitle}>Your code: {referralStats.code}</Text> : null}
        <GoldButton title="Share invite" variant="secondary" onPress={handleShare} />
        <GoldButton title="View details" variant="secondary" onPress={() => router.push('/referrals')} />
      </GlassCard>
    </UniversalBackground>
  );
}

const Badge = ({ label }: { label: string }) => (
  <View style={styles.badge}>
    <Text style={styles.badgeText}>{label}</Text>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
  },
  price: {
    ...typography.h3,
    color: colors.secondary,
    fontWeight: '700',
  },
  perkList: {
    gap: spacing.sm,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: spacing.lg,
    backgroundColor: colors.glass.medium,
  },
  badgeText: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '700',
  },
  boostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  perkText: {
    ...typography.body,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
});
