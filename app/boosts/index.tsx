import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import UniversalBackground from '@/components/universal/UniversalBackground';
import GlassCard from '@/components/GlassCard';
import GoldButton from '@/components/universal/GoldButton';
import { colors, spacing, typography } from '@/theme';
import { fetchBoostSummary, fetchBoostWindows, placeSpotlightBid, activateBoost } from '@/api/boosts';

export default function BoostsScreen() {
  const [windows, setWindows] = useState<{ id: string; start: string; currentHighestBid?: number; minBid?: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [selectedWindow, setSelectedWindow] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ remaining?: number; active?: boolean; minutesRemaining?: number } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sum, win] = await Promise.all([fetchBoostSummary(), fetchBoostWindows()]);
      setSummary(sum);
      setWindows(win);
    } catch (err: any) {
      Alert.alert('Boosts', err?.message || 'Could not load boosts');
    } finally {
      setLoading(false);
    }
  };

  const handleBid = async () => {
    if (!selectedWindow) return Alert.alert('Bid', 'Select a spotlight window');
    const amountNumber = Number(bidAmount);
    if (!amountNumber) return Alert.alert('Bid', 'Enter a valid bid amount');
    try {
      await placeSpotlightBid({ windowTime: selectedWindow, bidAmount: amountNumber });
      Alert.alert('Bid placed', 'Your spotlight bid was submitted.');
      setBidAmount('');
      await loadData();
    } catch (err: any) {
      Alert.alert('Bid failed', err?.message || 'Could not place bid');
    }
  };

  const handleActivate = async () => {
    try {
      setLoading(true);
      const res = await activateBoost();
      setSummary(res);
      Alert.alert('Boost active', 'Your boost has started.');
    } catch (err: any) {
      Alert.alert('Boost', err?.message || 'Could not activate boost');
    } finally {
      setLoading(false);
    }
  };

  return (
    <UniversalBackground
      scrollable
      contentContainerStyle={styles.scrollContent}
      title="Boosts & Spotlight"
      showBottomNav
    >
      {loading ? <ActivityIndicator color={colors.secondary} /> : null}

      <GlassCard style={styles.card} intensity={28} padding={spacing.lg}>
        <Text style={styles.title}>Current boost</Text>
        <View style={styles.row}>
          <Ionicons name="flash" size={18} color={colors.secondary} />
          <Text style={styles.copy}>
            {summary?.remaining ?? 0} boosts left • {summary?.active ? 'Active' : 'Inactive'}
          </Text>
        </View>
        {summary?.minutesRemaining ? <Text style={styles.copy}>{summary.minutesRemaining} minutes remaining</Text> : null}
        <GoldButton title="Activate boost" onPress={handleActivate} />
      </GlassCard>

      <GlassCard style={styles.card} intensity={26} padding={spacing.lg}>
        <Text style={styles.title}>Spotlight windows</Text>
        {windows.map((w) => {
          const selected = selectedWindow === (w.start || w.id);
          return (
            <View key={w.id} style={[styles.windowRow, selected && styles.windowSelected]}>
              <View style={styles.windowMeta}>
                <Text style={styles.windowTime}>{w.start || 'Window'}</Text>
                <Text style={styles.windowBid}>High bid: {w.currentHighestBid ?? '-'} | Min: {w.minBid ?? '-'}</Text>
              </View>
              <GoldButton
                title={selected ? 'Selected' : 'Select'}
                variant={selected ? 'secondary' : 'primary'}
                onPress={() => setSelectedWindow(w.start || w.id)}
                style={styles.smallBtn}
              />
            </View>
          );
        })}
        <View style={styles.bidRow}>
          <TextInput
            placeholder="Bid amount"
            value={bidAmount}
            onChangeText={setBidAmount}
            keyboardType="numeric"
            placeholderTextColor={colors.text.secondary}
            style={styles.input}
          />
          <GoldButton title="Place bid" onPress={handleBid} />
        </View>
      </GlassCard>
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
    gap: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  copy: {
    ...typography.body,
    color: colors.text.primary,
  },
  windowRow: {
    borderWidth: 1,
    borderColor: colors.glass.medium,
    borderRadius: spacing.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  windowSelected: {
    borderColor: colors.secondary,
  },
  windowMeta: {
    gap: 2,
  },
  windowTime: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '700',
  },
  windowBid: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  bidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.glass.medium,
    borderRadius: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  smallBtn: {
    alignSelf: 'flex-start',
  },
});
