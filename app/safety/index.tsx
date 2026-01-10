import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import UniversalBackground from '@/components/universal/UniversalBackground';
import GlassCard from '@/components/GlassCard';
import GoldButton from '@/components/universal/GoldButton';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { reportUser, blockUser, fetchBlockedUsers, unblockUser, BlockedUser } from '@/api/safety';

export default function SafetyScreen() {
  const [incognito, setIncognito] = useState(false);
  const [readReceipts, setReadReceipts] = useState(true);
  const [reportedUser, setReportedUser] = useState('');
  const [reportReason, setReportReason] = useState('inappropriate_content');
  const [blockTarget, setBlockTarget] = useState('');
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
    } catch (err: any) {
      Alert.alert('Blocked users', err?.message || 'Could not load blocked users');
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async () => {
    if (!reportedUser) return Alert.alert('Report', 'Enter a user ID to report');
    try {
      await reportUser({ reportedUserId: reportedUser, reason: reportReason });
      Alert.alert('Report submitted', 'We will review this report.');
      setReportedUser('');
    } catch (err: any) {
      Alert.alert('Report failed', err?.message || 'Could not submit report');
    }
  };

  const handleBlock = async () => {
    if (!blockTarget) return Alert.alert('Block', 'Enter a user ID to block');
    try {
      await blockUser({ blockedUserId: blockTarget });
      Alert.alert('Blocked', 'User blocked successfully');
      setBlockTarget('');
      loadBlocked();
    } catch (err: any) {
      Alert.alert('Block failed', err?.message || 'Could not block user');
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      await unblockUser({ blockedUserId: userId });
      setBlocked((prev) => prev.filter((u) => u.id !== userId));
    } catch (err: any) {
      Alert.alert('Unblock failed', err?.message || 'Could not unblock user');
    }
  };

  return (
    <UniversalBackground
      scrollable
      contentContainerStyle={styles.scrollContent}
      title="Safety Center"
      showBottomNav
    >
      <GlassCard style={styles.card} intensity={28} padding={spacing.lg}>
        <Text style={styles.title}>Safety controls</Text>
        <SettingRow label="Incognito mode" value={incognito} onChange={setIncognito} />
        <SettingRow label="Share read receipts" value={readReceipts} onChange={setReadReceipts} />
      </GlassCard>

      <GlassCard style={styles.card} intensity={28} padding={spacing.lg}>
        <Text style={styles.title}>Safety tips</Text>
        <Text style={styles.body}>Meet in public, tell a friend, and keep chats on-platform until you trust the person.</Text>
        <GoldButton title="View tips" onPress={() => {}} />
      </GlassCard>

      <GlassCard style={styles.card} intensity={28} padding={spacing.lg}>
        <Text style={styles.title}>Report or block</Text>
        <Text style={styles.body}>Flag unsafe behavior or block users instantly.</Text>
        <View style={styles.inputRow}>
          <TextInput
            placeholder="User ID to report"
            value={reportedUser}
            onChangeText={setReportedUser}
            placeholderTextColor={colors.text.secondary}
            style={styles.input}
          />
        </View>
        <View style={styles.inputRow}>
          <TextInput
            placeholder="Reason (e.g., harassment)"
            value={reportReason}
            onChangeText={setReportReason}
            placeholderTextColor={colors.text.secondary}
            style={styles.input}
          />
        </View>
        <View style={styles.inputRow}>
          <TextInput
            placeholder="User ID to block"
            value={blockTarget}
            onChangeText={setBlockTarget}
            placeholderTextColor={colors.text.secondary}
            style={styles.input}
          />
        </View>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionButton, styles.danger]} onPress={handleReport}>
            <Ionicons name="flag" size={18} color={colors.white} />
            <Text style={styles.actionText}>Report</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.secondary]} onPress={handleBlock}>
            <Ionicons name="ban" size={18} color={colors.primaryDark} />
            <Text style={[styles.actionText, styles.darkText]}>Block</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>

      <GlassCard style={styles.card} intensity={28} padding={spacing.lg}>
        <Text style={styles.title}>Blocked users</Text>
        {loading ? <ActivityIndicator color={colors.secondary} /> : null}
        {!blocked.length && !loading ? <Text style={styles.body}>No blocked users.</Text> : null}
        {blocked.map((user) => (
          <View key={user.id} style={styles.blockRow}>
            <View style={styles.blockMeta}>
              <Text style={styles.settingLabel}>{user.name || user.id}</Text>
              {user.reason ? <Text style={styles.body}>Reason: {user.reason}</Text> : null}
            </View>
            <TouchableOpacity style={[styles.actionButton, styles.secondary]} onPress={() => handleUnblock(user.id)}>
              <Ionicons name="checkmark" size={18} color={colors.primaryDark} />
              <Text style={[styles.actionText, styles.darkText]}>Unblock</Text>
            </TouchableOpacity>
          </View>
        ))}
      </GlassCard>
    </UniversalBackground>
  );
}

const SettingRow = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
  <View style={styles.settingRow}>
    <View style={styles.settingCopy}>
      <Text style={styles.settingLabel}>{label}</Text>
    </View>
    <Switch value={value} onValueChange={onChange} thumbColor={colors.secondary} trackColor={{ true: colors.glass.light, false: colors.glass.medium }} />
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
  body: {
    ...typography.body,
    color: colors.text.secondary,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  settingCopy: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    ...typography.body,
    color: colors.text.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  danger: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  secondary: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  actionText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '700',
  },
  darkText: {
    color: colors.primaryDark,
  },
  inputRow: {
    borderWidth: 1,
    borderColor: colors.glass.medium,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  input: {
    ...typography.body,
    color: colors.text.primary,
  },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  blockMeta: {
    flex: 1,
    gap: 2,
  },
});
