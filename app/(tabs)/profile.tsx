import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import UniversalBackground from '@/components/universal/UniversalBackground';
import PurpleCard from '@/components/universal/PurpleCard';
import GoldButton from '@/components/universal/GoldButton';
import GlassCard from '@/components/GlassCard';
import { useAuthStore } from '@/store/authStore';
import { colors, spacing, typography, borderRadius } from '@/theme';

const badges = [
  { icon: 'shield-checkmark', label: 'ID verified' },
  { icon: 'sparkles', label: 'Profile boosted' },
  { icon: 'chatbubbles', label: 'Responsive' },
];

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);

  const profilePhoto =
    user?.photos?.[0] ||
    user?.profilePhotos?.[0] ||
    (user as any)?.profilePhoto ||
    (Array.isArray((user as any)?.photo) ? (user as any).photo[0] : undefined) ||
    (user as any)?.photo ||
    (user as any)?.profileImage ||
    (user as any)?.profileImageUrl ||
    (user as any)?.avatar ||
    (user as any)?.image ||
    (user as any)?.photoUrl;

  const photoList =
    user?.photos && user.photos.length
      ? user.photos
      : user?.profilePhotos && user.profilePhotos.length
        ? user.profilePhotos
        : (user as any)?.profilePhoto
          ? [(user as any).profilePhoto]
          : [];

  const onboardingLocation = (user as any)?.onboarding?.step4;
  const residenceCity = onboardingLocation?.city || user?.city;
  const residenceCountry = onboardingLocation?.country || user?.country;
  const residenceLabel = [residenceCity, residenceCountry].filter(Boolean).join(', ') || 'Add residence';
  const originLabel =
    (user as any)?.countryOfOrigin ||
    (user as any)?.heritage ||
    (user as any)?.heritageCountry ||
    (user as any)?.onboarding?.step2?.heritage ||
    'Add origin';

  return (
    <UniversalBackground scrollable contentContainerStyle={styles.scrollContent} title="Profile">
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={styles.row}>
            <Image
              source={{ uri: profilePhoto || 'https://randomuser.me/api/portraits/women/65.jpg' }}
              style={styles.avatar}
            />
            <View style={styles.meta}>
              <Text style={styles.name}>{user?.name || 'Tribal Member'}</Text>
              <Text style={styles.subline}>Residence: {residenceLabel}</Text>
              <Text style={styles.subline}>Origin: {originLabel}</Text>
              <View style={styles.row}>
                <Ionicons name="location" size={14} color={colors.secondary} />
                <Text style={styles.caption}>{user?.tribe ? `${user.tribe} tribe` : 'Tribe unlisted'}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.editPill} onPress={() => router.push('/setup')} activeOpacity={0.8}>
            <Ionicons name="pencil" size={14} color={colors.primaryDark} />
            <Text style={styles.editPillText}>Edit profile</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.badgesRow}>
          {badges.map((badge) => (
            <View key={badge.label} style={styles.badge}>
              <Ionicons name={badge.icon as any} size={14} color={colors.primaryDark} />
              <Text style={styles.badgeText}>{badge.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {photoList.length > 0 && (
        <GlassCard style={styles.photoCard} intensity={24} padding={spacing.lg}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <View style={styles.photoGrid}>
            {photoList.map((uri, index) => (
              <Image key={`${uri}-${index}`} source={{ uri }} style={styles.photoThumb} />
            ))}
          </View>
        </GlassCard>
      )}

      <GlassCard style={styles.infoCard} intensity={28} padding={spacing.lg}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.bodyCopy}>
          {user?.bio || 'Share a short introduction about your faith, family, and what you are seeking.'}
        </Text>

        <View style={styles.infoGrid}>
          <InfoItem icon="briefcase" label="Work" value={user?.occupation || 'Add your role'} />
          <InfoItem icon="school" label="Education" value={user?.education || 'Add education'} />
          <InfoItem icon="heart" label="Looking for" value={user?.relationshipGoals?.join(', ') || 'Meaningful connection'} />
          <InfoItem icon="sparkles" label="Interests" value={user?.interests?.slice(0, 3).join(', ') || 'Add interests'} />
        </View>
      </GlassCard>

      <PurpleCard>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.sectionTitle}>Keep your profile fresh</Text>
            <Text style={styles.bodyCopy}>Swap photos, edit prompts, and manage safety settings.</Text>
          </View>
        </View>
        <View style={styles.actionRow}>
          <GoldButton title="Edit profile" onPress={() => router.push('/setup')} style={{ flex: 1 }} />
          <GoldButton title="Safety" onPress={() => router.push('/safety')} variant="secondary" style={{ flex: 1 }} />
        </View>
      </PurpleCard>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/settings')}>
        <Ionicons name="settings" size={18} color={colors.text.primary} />
        <Text style={styles.secondaryText}>Account & app settings</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.text.secondary} />
      </TouchableOpacity>
    </UniversalBackground>
  );
}

const InfoItem = ({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) => (
  <View style={styles.infoItem}>
    <View style={styles.infoIcon}>
      <Ionicons name={icon} size={16} color={colors.primaryDark} />
    </View>
    <View style={styles.infoCopy}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  meta: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    ...typography.h2,
    color: colors.text.primary,
  },
  subline: {
    ...typography.body,
    color: colors.text.secondary,
  },
  caption: {
    ...typography.caption,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  editPillText: {
    ...typography.small,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    ...typography.small,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  infoCard: {
    gap: spacing.md,
  },
  photoCard: {
    gap: spacing.md,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  photoThumb: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  bodyCopy: {
    ...typography.body,
    color: colors.text.secondary,
  },
  infoGrid: {
    gap: spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glass.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  infoValue: {
    ...typography.body,
    color: colors.text.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryText: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
    marginHorizontal: spacing.sm,
  },
});
