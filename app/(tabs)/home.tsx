import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import UniversalBackground from '@/components/universal/UniversalBackground';
import PurpleCard from '@/components/universal/PurpleCard';
import GoldButton from '@/components/universal/GoldButton';
import { useAuthStore } from '@/store/authStore';
import { colors, spacing, typography, borderRadius, gradients, shadows } from '@/theme';

const statGradients = [
  ['#FF6B9D', '#C44569'],
  ['#6366F1', '#4F46E5'],
  ['#A855F7', '#7C3AED'],
  ['#EC4899', '#DB2777'],
];

const quickActions = [
  { icon: 'compass', title: 'Discover', subtitle: 'Browse new members nearby', route: '/(tabs)/discover', tone: colors.secondary },
  { icon: 'flame', title: 'Matches', subtitle: 'See who liked you back', route: '/(tabs)/matches', tone: colors.sunset },
  { icon: 'chatbubbles', title: 'Chat', subtitle: 'Jump back into conversations', route: '/(tabs)/chat', tone: colors.success },
  { icon: 'ribbon', title: 'Premium & boosts', subtitle: 'Upgrade, boosts, spotlight', route: '/premium', tone: colors.accent },
  { icon: 'shield-checkmark', title: 'Safety center', subtitle: 'Safety tips, report/block', route: '/safety', tone: colors.success },
  { icon: 'people', title: 'Community & events', subtitle: 'Join tribes and meetups', route: '/community', tone: colors.primaryLight },
  { icon: 'sparkles', title: 'Concierge', subtitle: 'Date planning concierge', route: '/concierge', tone: colors.secondaryLight },
  { icon: 'book', title: 'Dating tips', subtitle: 'Guides and how-tos', route: '/tips', tone: colors.secondary },
  { icon: 'settings', title: 'Settings', subtitle: 'Account, privacy, notifications', route: '/settings', tone: colors.text.primary },
];

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);

  const stats = [
    { label: 'Matches', value: user?.profileCompletion ? Math.max(2, Math.round(user.profileCompletion / 10)) : 8 },
    { label: 'Views', value: user?.age ? user.age + 12 : 42 },
    { label: 'Chats', value: 7 },
    { label: 'Likes', value: 18 },
  ];

  return (
    <UniversalBackground
      scrollable
      contentContainerStyle={styles.scrollContent}
      showBackButton={false}
      onProfilePress={() => router.push('/(tabs)/profile')}
      onEditProfilePress={() => router.push('/(tabs)/profile')}
      onSettingsPress={() => router.push('/(tabs)/profile')}
    >
      <View style={styles.heroCard}>
        <LinearGradient
          colors={gradients.royal.colors}
          start={gradients.royal.start}
          end={gradients.royal.end}
          locations={gradients.royal.locations}
          style={styles.heroGradient}
        >
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.greeting}>Hi {user?.name?.split(' ')[0] || 'there'}!</Text>
              <Text style={styles.subtitle}>Ready to meet someone new?</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="shield-checkmark" size={18} color={colors.primaryDark} />
              <Text style={styles.badgeText}>Verified vibes</Text>
            </View>
          </View>
          <View style={styles.progressRow}>
            <View style={styles.progressLabelRow}>
              <Ionicons name="sparkles" size={16} color={colors.secondary} />
              <Text style={styles.progressLabel}>Profile completeness</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${user?.profileCompletion || 78}%` }]} />
            </View>
            <Text style={styles.progressValue}>{user?.profileCompletion || 78}%</Text>
          </View>
        </LinearGradient>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statsRow}
      >
        {stats.map((item, index) => (
          <LinearGradient
            key={item.label}
            colors={statGradients[index % statGradients.length]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <Text style={styles.statValue}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </LinearGradient>
        ))}
      </ScrollView>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick actions</Text>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.title}
            style={styles.actionButton}
            onPress={() => router.push(action.route)}
            activeOpacity={0.85}
          >
            <View style={[styles.iconPill, { backgroundColor: `${action.tone}1A` }]}>
              <Ionicons name={action.icon as any} size={22} color={action.tone} />
            </View>
            <View style={styles.actionCopy}>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>
        ))}
      </View>

      <PurpleCard style={styles.upgradeCard}>
        <Text style={styles.upgradeTitle}>Boost your visibility</Text>
        <Text style={styles.upgradeText}>
          Upgrade to get priority placement, weekly boosts, and guaranteed date planning support.
        </Text>
        <GoldButton
          title="See plans"
          onPress={() => Alert.alert('Coming soon', 'Subscriptions are coming soon.')}
          style={styles.upgradeButton}
        />
      </PurpleCard>
    </UniversalBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
  },
  heroCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  heroGradient: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    ...typography.h2,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    color: colors.white,
    opacity: 0.9,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    ...typography.small,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  progressRow: {
    gap: spacing.sm,
  },
  progressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  progressLabel: {
    ...typography.caption,
    color: colors.white,
    opacity: 0.85,
  },
  progressBar: {
    height: 10,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glass.dark,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.secondary,
  },
  progressValue: {
    ...typography.caption,
    color: colors.white,
    opacity: 0.9,
  },
  statsRow: {
    gap: spacing.sm,
  },
  statCard: {
    width: 110,
    height: 110,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    ...typography.h2,
    color: colors.white,
    fontWeight: 'bold',
  },
  statLabel: {
    ...typography.caption,
    color: colors.white,
    opacity: 0.85,
    marginTop: spacing.xs,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    marginBottom: spacing.sm,
  },
  iconPill: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCopy: {
    flex: 1,
    marginLeft: spacing.md,
  },
  actionTitle: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '700',
  },
  actionSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  upgradeCard: {
    marginBottom: spacing.xxl,
  },
  upgradeTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  upgradeText: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  upgradeButton: {
    alignSelf: 'flex-start',
    width: '100%',
  },
});
