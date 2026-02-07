import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import UniversalBackground from '@/components/universal/UniversalBackground';
import { colors, spacing, typography, borderRadius, shadows } from '@/theme';
import { fetchBlockedUsers, unblockUser, BlockedUser } from '@/api/safety';

const SAFETY_TIPS = [
  {
    icon: 'location' as const,
    title: 'Meet in public',
    description: 'Always choose a busy, well-lit location for your first few dates.',
  },
  {
    icon: 'people' as const,
    title: 'Tell someone',
    description: 'Share your date plans with a trusted friend or family member.',
  },
  {
    icon: 'chatbubble-ellipses' as const,
    title: 'Stay on platform',
    description: 'Keep conversations on Tribal Mingle until you feel comfortable.',
  },
  {
    icon: 'eye-off' as const,
    title: 'Protect your info',
    description: "Don't share financial details, home address, or workplace early on.",
  },
];

export default function SafetyScreen() {
  const [incognito, setIncognito] = useState(false);
  const [readReceipts, setReadReceipts] = useState(true);
  const [locationSharing, setLocationSharing] = useState(false);
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlocked();
  }, []);

  const loadBlocked = async () => {
    setLoading(true);
    try {
      const list = await fetchBlockedUsers();
      setBlocked(list);
    } catch {
      setBlocked([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      await unblockUser({ blockedUserId: userId });
      setBlocked((prev) => prev.filter((u) => u.id !== userId));
    } catch {
      // Silent
    }
  };

  return (
    <UniversalBackground
      scrollable
      contentContainerStyle={styles.scrollContent}
      title="Safety Center"
      showBottomNav
    >
      {/* Hero */}
      <LinearGradient
        colors={['#22C55E', '#16A34A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroIconContainer}>
          <Ionicons name="shield-checkmark" size={40} color="#FFFFFF" />
        </View>
        <Text style={styles.heroTitle}>Your safety matters</Text>
        <Text style={styles.heroSubtitle}>
          We're committed to keeping Tribal Mingle a safe space for everyone.
        </Text>
      </LinearGradient>

      {/* Quick Actions */}
      <View style={styles.quickActionsRow}>
        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => router.push('/safety/privacy')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['rgba(124, 58, 237, 0.2)', 'rgba(167, 139, 250, 0.1)']}
            style={styles.quickActionGradient}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="lock-closed" size={24} color={colors.primaryLight} />
            </View>
            <Text style={styles.quickActionTitle}>Privacy</Text>
            <Text style={styles.quickActionDesc}>Manage your data</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => router.push('/settings')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['rgba(212, 175, 55, 0.2)', 'rgba(212, 175, 55, 0.1)']}
            style={styles.quickActionGradient}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(212, 175, 55, 0.15)' }]}>
              <Ionicons name="settings" size={24} color={colors.secondary} />
            </View>
            <Text style={styles.quickActionTitle}>Settings</Text>
            <Text style={styles.quickActionDesc}>Account controls</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Safety Controls */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="options" size={20} color={colors.secondary} />
          <Text style={styles.sectionTitle}>Safety Controls</Text>
        </View>
        <ControlRow icon="eye-off" label="Incognito Mode" description="Browse profiles without being seen" value={incognito} onChange={setIncognito} />
        <View style={styles.divider} />
        <ControlRow icon="checkmark-done" label="Read Receipts" description="Let others know when you've read messages" value={readReceipts} onChange={setReadReceipts} />
        <View style={styles.divider} />
        <ControlRow icon="navigate" label="Location Sharing" description="Share your approximate location" value={locationSharing} onChange={setLocationSharing} />
      </View>

      {/* Tips */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="bulb" size={20} color={colors.secondary} />
          <Text style={styles.sectionTitle}>Dating Safety Tips</Text>
        </View>
        {SAFETY_TIPS.map((tip, index) => (
          <View key={tip.title}>
            {index > 0 && <View style={styles.divider} />}
            <View style={styles.tipRow}>
              <View style={styles.tipIconContainer}>
                <Ionicons name={tip.icon} size={20} color={colors.primaryLight} />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipDescription}>{tip.description}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Blocked Users */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="ban" size={20} color={colors.error} />
          <Text style={styles.sectionTitle}>Blocked Users</Text>
          <Text style={styles.sectionCount}>({blocked.length})</Text>
        </View>
        {loading ? (
          <ActivityIndicator color={colors.secondary} style={{ paddingVertical: spacing.lg }} />
        ) : blocked.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={32} color={colors.success} />
            <Text style={styles.emptyText}>No blocked users</Text>
            <Text style={styles.emptySubtext}>You can block anyone from their profile or chat screen</Text>
          </View>
        ) : (
          blocked.map((user, index) => (
            <View key={user.id}>
              {index > 0 && <View style={styles.divider} />}
              <View style={styles.blockedRow}>
                <View style={styles.blockedAvatar}>
                  <Text style={styles.blockedInitial}>{(user.name || user.id)?.[0]?.toUpperCase() || '?'}</Text>
                </View>
                <View style={styles.blockedInfo}>
                  <Text style={styles.blockedName}>{user.name || 'Unknown User'}</Text>
                  {user.reason && <Text style={styles.blockedReason}>{user.reason}</Text>}
                </View>
                <TouchableOpacity style={styles.unblockButton} onPress={() => handleUnblock(user.id)}>
                  <Text style={styles.unblockText}>Unblock</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Emergency */}
      <TouchableOpacity style={styles.emergencyCard} activeOpacity={0.9}>
        <LinearGradient
          colors={['rgba(248, 113, 113, 0.15)', 'rgba(248, 113, 113, 0.05)']}
          style={styles.emergencyGradient}
        >
          <View style={styles.emergencyIcon}>
            <Ionicons name="call" size={24} color={colors.error} />
          </View>
          <View style={styles.emergencyContent}>
            <Text style={styles.emergencyTitle}>Need immediate help?</Text>
            <Text style={styles.emergencyDesc}>If you feel unsafe, contact local emergency services.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
        </LinearGradient>
      </TouchableOpacity>
    </UniversalBackground>
  );
}

const ControlRow = ({ icon, label, description, value, onChange }: { icon: keyof typeof Ionicons.glyphMap; label: string; description: string; value: boolean; onChange: (v: boolean) => void }) => (
  <View style={styles.controlRow}>
    <View style={styles.controlIconContainer}>
      <Ionicons name={icon} size={18} color={colors.primaryLight} />
    </View>
    <View style={styles.controlContent}>
      <Text style={styles.controlLabel}>{label}</Text>
      <Text style={styles.controlDescription}>{description}</Text>
    </View>
    <Switch value={value} onValueChange={onChange} thumbColor={value ? colors.primaryLight : '#ccc'} trackColor={{ true: 'rgba(124, 58, 237, 0.3)', false: 'rgba(255,255,255,0.1)' }} />
  </View>
);

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  heroCard: { borderRadius: borderRadius.xl, padding: spacing.xl, alignItems: 'center', gap: spacing.md, ...shadows.md },
  heroIconContainer: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  heroSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 22 },
  quickActionsRow: { flexDirection: 'row', gap: spacing.sm },
  quickActionCard: { flex: 1, borderRadius: borderRadius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  quickActionGradient: { padding: spacing.lg, alignItems: 'center', gap: spacing.sm },
  quickActionIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(124, 58, 237, 0.15)', alignItems: 'center', justifyContent: 'center' },
  quickActionTitle: { fontSize: 15, fontWeight: '700', color: colors.text.primary },
  quickActionDesc: { fontSize: 12, color: colors.text.secondary },
  card: { backgroundColor: 'rgba(167, 139, 250, 0.06)', borderRadius: borderRadius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text.primary, flex: 1 },
  sectionCount: { fontSize: 14, color: colors.text.secondary },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  controlRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs },
  controlIconContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(124, 58, 237, 0.12)', alignItems: 'center', justifyContent: 'center' },
  controlContent: { flex: 1, gap: 2 },
  controlLabel: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  controlDescription: { fontSize: 12, color: colors.text.secondary, lineHeight: 16 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingVertical: spacing.xs },
  tipIconContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(124, 58, 237, 0.12)', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  tipContent: { flex: 1, gap: 2 },
  tipTitle: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  tipDescription: { fontSize: 13, color: colors.text.secondary, lineHeight: 18 },
  emptyState: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  emptyText: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  emptySubtext: { fontSize: 13, color: colors.text.secondary, textAlign: 'center', lineHeight: 18 },
  blockedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs },
  blockedAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(248, 113, 113, 0.15)', alignItems: 'center', justifyContent: 'center' },
  blockedInitial: { fontSize: 16, fontWeight: '700', color: colors.error },
  blockedInfo: { flex: 1, gap: 2 },
  blockedName: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  blockedReason: { fontSize: 12, color: colors.text.secondary },
  unblockButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.border },
  unblockText: { fontSize: 13, fontWeight: '600', color: colors.text.secondary },
  emergencyCard: { borderRadius: borderRadius.xl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(248, 113, 113, 0.2)' },
  emergencyGradient: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
  emergencyIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(248, 113, 113, 0.15)', alignItems: 'center', justifyContent: 'center' },
  emergencyContent: { flex: 1, gap: 2 },
  emergencyTitle: { fontSize: 15, fontWeight: '700', color: colors.error },
  emergencyDesc: { fontSize: 12, color: colors.text.secondary, lineHeight: 16 },
});
