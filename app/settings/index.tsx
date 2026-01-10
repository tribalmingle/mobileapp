import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Switch, Alert, TextInput } from 'react-native';
import { router } from 'expo-router';
import UniversalBackground from '@/components/universal/UniversalBackground';
import GlassCard from '@/components/GlassCard';
import GoldButton from '@/components/universal/GoldButton';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { trackEvent, captureError } from '@/lib/analytics';
import { deleteAccount } from '@/api/safety';

export default function SettingsScreen() {
  const logout = useAuthStore((state) => state.logout);
  const {
    distance,
    ageMin,
    ageMax,
    tribes,
    pushNotifications,
    emailUpdates,
    showOnlineStatus,
    readReceipts,
    paused,
    loading,
    loadSettings,
    updateSettings,
  } = useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSignOut = async () => {
    try {
      await logout();
      trackEvent('logout');
      router.replace('/(auth)/login');
    } catch (err: any) {
      captureError(err, { context: 'logout' });
      Alert.alert('Sign out failed', err?.message || 'Please try again.');
    }
  };

  const handleDelete = async () => {
    Alert.alert('Delete account', 'This will permanently remove your account. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAccount({ reason: 'user_request' });
            await logout();
            trackEvent('account_delete');
            router.replace('/(auth)/signup');
          } catch (err: any) {
            captureError(err, { context: 'delete_account' });
            Alert.alert('Delete failed', err?.message || 'Could not delete account');
          }
        },
      },
    ]);
  };

  return (
    <UniversalBackground
      scrollable
      contentContainerStyle={styles.scrollContent}
      title="Settings"
      showBottomNav
    >
      <GlassCard style={styles.card} intensity={28} padding={spacing.lg}>
        <Text style={styles.title}>Notifications</Text>
        <SettingRow label="Push notifications" value={pushNotifications} onChange={(v) => updateSettings({ pushNotifications: v })} />
        <SettingRow label="Email updates" value={emailUpdates} onChange={(v) => updateSettings({ emailUpdates: v })} />
      </GlassCard>

      <GlassCard style={styles.card} intensity={28} padding={spacing.lg}>
        <Text style={styles.title}>Privacy</Text>
        <SettingRow label="Show online status" value={showOnlineStatus} onChange={(v) => updateSettings({ showOnlineStatus: v })} />
        <SettingRow label="Read receipts" value={readReceipts} onChange={(v) => updateSettings({ readReceipts: v })} />
        <SettingRow label="Pause profile" value={paused} onChange={(v) => updateSettings({ paused: v })} />
        <GoldButton title="Privacy & safety" onPress={() => router.push('/safety')} />
      </GlassCard>

      <GlassCard style={styles.card} intensity={28} padding={spacing.lg}>
        <Text style={styles.title}>Discovery filters</Text>
        <InputRow label="Distance (km)" value={String(distance)} onChange={(text) => updateSettings({ distance: Number(text) || 0 })} />
        <InputRow label="Age range" value={`${ageMin}-${ageMax}`} editable={false} />
        <View style={styles.inlineInputs}>
          <InlineInput
            label="Min"
            value={String(ageMin)}
            onChange={(text) => updateSettings({ ageMin: Number(text) || ageMin })}
          />
          <InlineInput
            label="Max"
            value={String(ageMax)}
            onChange={(text) => updateSettings({ ageMax: Number(text) || ageMax })}
          />
        </View>
        <InputRow label="Tribes" value={tribes} onChange={(text) => updateSettings({ tribes: text })} placeholder="Igbo, Yoruba" />
      </GlassCard>

      <GoldButton title="Sign out" variant="secondary" onPress={handleSignOut} />
      <GoldButton title="Delete account" variant="secondary" onPress={handleDelete} />
    </UniversalBackground>
  );
}

const SettingRow = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
  <View style={styles.settingRow}>
    <Text style={styles.settingLabel}>{label}</Text>
    <Switch value={value} onValueChange={onChange} thumbColor={colors.secondary} trackColor={{ true: colors.glowGold, false: colors.glass.medium }} />
  </View>
);

const InputRow = ({ label, value, onChange, placeholder, editable = true }: { label: string; value: string; onChange?: (t: string) => void; placeholder?: string; editable?: boolean }) => (
  <View style={styles.inputRow}>
    <Text style={styles.settingLabel}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={colors.text.secondary}
      editable={editable && !!onChange}
    />
  </View>
);

const InlineInput = ({ label, value, onChange }: { label: string; value: string; onChange: (t: string) => void }) => (
  <View style={styles.inlineInput}>
    <Text style={styles.inlineLabel}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChange}
      keyboardType="numeric"
      placeholderTextColor={colors.text.secondary}
    />
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
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  settingLabel: {
    ...typography.body,
    color: colors.text.primary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.glass.medium,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minWidth: 120,
    textAlign: 'right',
  },
  inlineInputs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inlineInput: {
    flex: 1,
  },
  inlineLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
});
