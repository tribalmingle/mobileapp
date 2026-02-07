import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
  Share,
  TouchableOpacity,
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import UniversalBackground from '@/components/universal/UniversalBackground';
import { colors, spacing, typography, borderRadius, shadows } from '@/theme';
import { fetchReferralCode, fetchReferralProgress, sendReferralInvite, ReferralProgress } from '@/api/referrals';

export default function ReferralsScreen() {
  const [progress, setProgress] = useState<ReferralProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);

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
      setSending(true);
      await sendReferralInvite({ email: email || undefined, phone: phone || undefined });
      Alert.alert('Sent!', 'Your invitation has been sent');
      setEmail('');
      setPhone('');
      await loadData();
    } catch (err: any) {
      Alert.alert('Invite failed', err?.message || 'Could not send invite');
    } finally {
      setSending(false);
    }
  };

  const handleShare = async () => {
    try {
      const code = progress?.code || 'YOURCODE';
      const link = progress?.shareUrl || 'https://tribalmingle.app/invite';
      await Share.share({
        message: `Join me on Tribal Mingle! Use my code ${code} to sign up and we both get rewards 🎉\n\n${link}`,
      });
    } catch {
      // User cancelled
    }
  };

  const handleCopy = () => {
    const code = progress?.code || '';
    if (code) {
      Clipboard.setString(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <UniversalBackground scrollable contentContainerStyle={styles.scrollContent} title="Referrals" showBottomNav>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.secondary} />
          <Text style={styles.loadingText}>Loading your referrals...</Text>
        </View>
      </UniversalBackground>
    );
  }

  return (
    <UniversalBackground
      scrollable
      contentContainerStyle={styles.scrollContent}
      title="Refer & Earn"
      showBottomNav
    >
      {/* Hero */}
      <LinearGradient
        colors={['#D4AF37', '#B8860B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroIconContainer}>
          <Ionicons name="gift" size={40} color="#FFFFFF" />
        </View>
        <Text style={styles.heroTitle}>Share the Love</Text>
        <Text style={styles.heroSubtitle}>
          Invite friends to Tribal Mingle and earn rewards for every successful referral.
        </Text>
      </LinearGradient>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <LinearGradient
            colors={['rgba(34, 197, 94, 0.15)', 'rgba(34, 197, 94, 0.05)']}
            style={styles.statGradient}
          >
            <Text style={styles.statNumber}>{progress?.successfulReferrals ?? 0}</Text>
            <Text style={styles.statLabel}>Successful</Text>
          </LinearGradient>
        </View>
        <View style={styles.statCard}>
          <LinearGradient
            colors={['rgba(124, 58, 237, 0.15)', 'rgba(124, 58, 237, 0.05)']}
            style={styles.statGradient}
          >
            <Text style={styles.statNumber}>{progress?.pendingReferrals ?? 0}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </LinearGradient>
        </View>
        <View style={styles.statCard}>
          <LinearGradient
            colors={['rgba(212, 175, 55, 0.15)', 'rgba(212, 175, 55, 0.05)']}
            style={styles.statGradient}
          >
            <Text style={styles.statNumber}>{progress?.totalReferrals ?? 0}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </LinearGradient>
        </View>
      </View>

      {/* Rewards Earned */}
      {(progress?.rewards?.creditsEarned || progress?.rewards?.freeDaysEarned) ? (
        <View style={styles.rewardsCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trophy" size={20} color={colors.secondary} />
            <Text style={styles.sectionTitle}>Your Rewards</Text>
          </View>
          <View style={styles.rewardsRow}>
            {progress?.rewards?.creditsEarned ? (
              <View style={styles.rewardChip}>
                <Ionicons name="cash" size={16} color={colors.secondary} />
                <Text style={styles.rewardChipText}>{progress.rewards.creditsEarned} Credits</Text>
              </View>
            ) : null}
            {progress?.rewards?.freeDaysEarned ? (
              <View style={styles.rewardChip}>
                <Ionicons name="sparkles" size={16} color={colors.primaryLight} />
                <Text style={styles.rewardChipText}>{progress.rewards.freeDaysEarned} Free Days</Text>
              </View>
            ) : null}
          </View>
          {progress?.rewards?.nextReward?.reward ? (
            <View style={styles.nextRewardBanner}>
              <Ionicons name="arrow-forward-circle" size={18} color={colors.primaryLight} />
              <Text style={styles.nextRewardText}>
                Next: {progress.rewards.nextReward.reward} — {progress.rewards.nextReward.referralsNeeded || 0} more referral(s)
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Share Code */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="share-social" size={20} color={colors.secondary} />
          <Text style={styles.sectionTitle}>Your Referral Code</Text>
        </View>

        <TouchableOpacity style={styles.codeBox} onPress={handleCopy} activeOpacity={0.8}>
          <Text style={styles.codeText}>{progress?.code || '—'}</Text>
          <View style={styles.copyButton}>
            <Ionicons name={copied ? 'checkmark' : 'copy'} size={18} color={copied ? colors.success : colors.primaryLight} />
            <Text style={[styles.copyText, copied && { color: colors.success }]}>
              {copied ? 'Copied!' : 'Copy'}
            </Text>
          </View>
        </TouchableOpacity>

        {progress?.shareUrl ? (
          <Text style={styles.shareUrlText} numberOfLines={1}>{progress.shareUrl}</Text>
        ) : null}

        <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.85}>
          <LinearGradient
            colors={['#D4AF37', '#B8860B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shareButtonGradient}
          >
            <Ionicons name="share" size={20} color="#FFF" />
            <Text style={styles.shareButtonText}>Share Invite Link</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Send Direct Invite */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="mail" size={20} color={colors.secondary} />
          <Text style={styles.sectionTitle}>Send Direct Invite</Text>
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.inputIcon}>
            <Ionicons name="mail-outline" size={18} color={colors.text.secondary} />
          </View>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="friend@email.com"
            placeholderTextColor={colors.text.secondary}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.inputIcon}>
            <Ionicons name="call-outline" size={18} color={colors.text.secondary} />
          </View>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+2348012345678"
            placeholderTextColor={colors.text.secondary}
            style={styles.input}
            keyboardType="phone-pad"
          />
        </View>

        <TouchableOpacity
          style={[styles.sendButton, (!email && !phone) && styles.sendButtonDisabled]}
          onPress={handleInvite}
          disabled={sending || (!email && !phone)}
          activeOpacity={0.85}
        >
          {sending ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <Ionicons name="send" size={18} color="#FFF" />
              <Text style={styles.sendButtonText}>Send Invitation</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* History */}
      {progress?.referralHistory?.length ? (
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time" size={20} color={colors.secondary} />
            <Text style={styles.sectionTitle}>Referral History</Text>
          </View>

          {progress.referralHistory.map((item, idx) => (
            <View key={`${item.name}-${idx}`}>
              {idx > 0 && <View style={styles.divider} />}
              <View style={styles.historyRow}>
                <View style={styles.historyAvatar}>
                  <Text style={styles.historyInitial}>{item.name?.[0]?.toUpperCase() || '?'}</Text>
                </View>
                <View style={styles.historyContent}>
                  <Text style={styles.historyName}>{item.name}</Text>
                  <View style={styles.historyStatusRow}>
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: item.status === 'completed' ? colors.success : item.status === 'pending' ? colors.warning : colors.text.secondary },
                    ]} />
                    <Text style={styles.historyStatus}>{item.status}</Text>
                  </View>
                </View>
                {item.rewardEarned ? (
                  <View style={styles.rewardBadge}>
                    <Text style={styles.rewardBadgeText}>{item.rewardEarned}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {/* How it works */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="help-circle" size={20} color={colors.secondary} />
          <Text style={styles.sectionTitle}>How It Works</Text>
        </View>

        <StepItem number={1} title="Share your code" description="Send your unique referral code to friends" />
        <StepItem number={2} title="Friend signs up" description="They create an account using your code" />
        <StepItem number={3} title="Both earn rewards" description="You both get premium rewards!" />
      </View>
    </UniversalBackground>
  );
}

const StepItem = ({ number, title, description }: { number: number; title: string; description: string }) => (
  <View style={styles.stepRow}>
    <View style={styles.stepNumber}>
      <Text style={styles.stepNumberText}>{number}</Text>
    </View>
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 100, gap: spacing.md },
  loadingText: { fontSize: 14, color: colors.text.secondary },
  // Hero
  heroCard: { borderRadius: borderRadius.xl, padding: spacing.xl, alignItems: 'center', gap: spacing.md, ...shadows.md },
  heroIconContainer: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  heroSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 22 },
  // Stats
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1, borderRadius: borderRadius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  statGradient: { alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.xs },
  statNumber: { fontSize: 28, fontWeight: '800', color: colors.text.primary },
  statLabel: { fontSize: 12, fontWeight: '600', color: colors.text.secondary },
  // Rewards
  rewardsCard: { backgroundColor: 'rgba(212, 175, 55, 0.08)', borderRadius: borderRadius.xl, padding: spacing.lg, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.2)' },
  rewardsRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  rewardChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: 'rgba(212, 175, 55, 0.12)', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full },
  rewardChipText: { fontSize: 14, fontWeight: '700', color: colors.text.primary },
  nextRewardBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md, backgroundColor: 'rgba(124, 58, 237, 0.1)', borderRadius: borderRadius.md, padding: spacing.sm },
  nextRewardText: { fontSize: 13, color: colors.text.secondary, flex: 1 },
  // Card
  card: { backgroundColor: 'rgba(167, 139, 250, 0.06)', borderRadius: borderRadius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text.primary, flex: 1 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  // Code
  codeBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(124, 58, 237, 0.1)', borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  codeText: { fontSize: 22, fontWeight: '800', color: colors.secondary, letterSpacing: 3 },
  copyButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  copyText: { fontSize: 13, fontWeight: '600', color: colors.primaryLight },
  shareUrlText: { fontSize: 12, color: colors.text.secondary, textAlign: 'center', marginTop: spacing.xs },
  shareButton: { borderRadius: borderRadius.lg, overflow: 'hidden', marginTop: spacing.sm },
  shareButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  shareButtonText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  // Inputs
  inputGroup: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  inputIcon: { width: 32, alignItems: 'center' },
  input: { flex: 1, fontSize: 15, color: colors.text.primary, paddingVertical: spacing.md },
  sendButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, borderRadius: borderRadius.lg, paddingVertical: spacing.md, marginTop: spacing.xs },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  // History
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs },
  historyAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(124, 58, 237, 0.12)', alignItems: 'center', justifyContent: 'center' },
  historyInitial: { fontSize: 16, fontWeight: '700', color: colors.primaryLight },
  historyContent: { flex: 1, gap: 2 },
  historyName: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  historyStatusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  historyStatus: { fontSize: 12, color: colors.text.secondary, textTransform: 'capitalize' },
  rewardBadge: { backgroundColor: 'rgba(212, 175, 55, 0.12)', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  rewardBadgeText: { fontSize: 12, fontWeight: '700', color: colors.secondary },
  // Steps
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingVertical: spacing.sm },
  stepNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  stepContent: { flex: 1, gap: 2 },
  stepTitle: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  stepDescription: { fontSize: 13, color: colors.text.secondary, lineHeight: 18 },
});
