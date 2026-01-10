import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TextInput, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import UniversalBackground from '@/components/universal/UniversalBackground';
import GlassCard from '@/components/GlassCard';
import GoldButton from '@/components/universal/GoldButton';
import { colors, spacing, typography } from '@/theme';
import { fetchReferralCode, fetchReferralProgress, sendReferralInvite, ReferralProgress } from '@/api/referrals';

export default function ReferralsScreen() {
  const [progress, setProgress] = useState<ReferralProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setError(null);
    setLoading(true);
    try {
      const [prog, codeData] = await Promise.all([fetchReferralProgress(), fetchReferralCode()]);
      setProgress({ ...prog, code: prog.code || codeData.code, shareUrl: prog.shareUrl || codeData.shareUrl });
    } catch (err: any) {
      setError(err?.message || 'Could not load referrals');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!email && !phone) return Alert.alert('Invite', 'Enter an email or phone number');
    try {
      setLoading(true);
      await sendReferralInvite({ email: email || undefined, phone: phone || undefined });
      Alert.alert('Sent', 'Invitation sent successfully');
      setEmail('');
      setPhone('');
      await loadData();
    } catch (err: any) {
      Alert.alert('Invite failed', err?.message || 'Could not send invite');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const code = progress?.code || 'YOURCODE';
      const link = progress?.shareUrl || 'https://tribalmingle.app/invite';
      await Share.share({ message: `Join me on Tribal Mingle with my code ${code}: ${link}` });
    } catch (err: any) {
      Alert.alert('Share failed', err?.message || 'Could not share code');
    }
  };

  return (
    <UniversalBackground
      scrollable
      contentContainerStyle={styles.scrollContent}
      title="Referrals"
      showBottomNav
    >
      {loading ? <ActivityIndicator color={colors.secondary} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <GlassCard style={styles.card} intensity={28} padding={spacing.lg}>
        <Text style={styles.title}>Your progress</Text>
        <StatRow icon="gift" label="Successful" value={progress?.successfulReferrals ?? 0} />
        <StatRow icon="time" label="Pending" value={progress?.pendingReferrals ?? 0} />
        <StatRow icon="people" label="Total" value={progress?.totalReferrals ?? 0} />
        {progress?.rewards?.creditsEarned ? <StatRow icon="cash" label="Credits" value={progress.rewards.creditsEarned} /> : null}
        {progress?.rewards?.freeDaysEarned ? <StatRow icon="sparkles" label="Free days" value={progress.rewards.freeDaysEarned} /> : null}
        {progress?.rewards?.nextReward?.reward ? (
          <Text style={styles.subtitle}>
            Next reward: {progress.rewards.nextReward.reward} (need {progress.rewards.nextReward.referralsNeeded || 0} more)
          </Text>
        ) : null}
      </GlassCard>

      <GlassCard style={styles.card} intensity={24} padding={spacing.lg}>
        <Text style={styles.title}>Share your code</Text>
        {progress?.code ? <Text style={styles.subtitle}>Code: {progress.code}</Text> : null}
        {progress?.shareUrl ? <Text style={styles.subtitle}>Link: {progress.shareUrl}</Text> : null}
        <GoldButton title="Share invite" onPress={handleShare} />
      </GlassCard>

      <GlassCard style={styles.card} intensity={24} padding={spacing.lg}>
        <Text style={styles.title}>Send an invite</Text>
        <View style={styles.inputGroup}>
          <Ionicons name="mail" size={16} color={colors.text.secondary} />
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="friend@email.com"
            placeholderTextColor={colors.text.secondary}
            style={styles.input}
            keyboardType="email-address"
          />
        </View>
        <View style={styles.inputGroup}>
          <Ionicons name="call" size={16} color={colors.text.secondary} />
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+2348012345678"
            placeholderTextColor={colors.text.secondary}
            style={styles.input}
            keyboardType="phone-pad"
          />
        </View>
        <GoldButton title="Send invite" onPress={handleInvite} />
      </GlassCard>

      {progress?.referralHistory?.length ? (
        <GlassCard style={styles.card} intensity={22} padding={spacing.lg}>
          <Text style={styles.title}>History</Text>
          {progress.referralHistory.map((item, idx) => (
            <View key={`${item.name}-${idx}`} style={styles.historyRow}>
              <View style={styles.historyMeta}>
                <Text style={styles.historyName}>{item.name}</Text>
                <Text style={styles.historyStatus}>{item.status}</Text>
              </View>
              <Text style={styles.historyReward}>{item.rewardEarned}</Text>
            </View>
          ))}
        </GlassCard>
      ) : null}
    </UniversalBackground>
  );
}

const StatRow = ({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: number }) => (
  <View style={styles.statRow}>
    <Ionicons name={icon} size={18} color={colors.secondary} />
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
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
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statLabel: {
    ...typography.body,
    color: colors.text.secondary,
    flex: 1,
  },
  statValue: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '700',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderColor: colors.glass.medium,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    paddingVertical: spacing.xs,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderColor: colors.glass.light,
  },
  historyMeta: {
    gap: 2,
  },
  historyName: {
    ...typography.body,
    color: colors.text.primary,
  },
  historyStatus: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  historyReward: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '700',
  },
  error: {
    ...typography.body,
    color: colors.error,
  },
});
