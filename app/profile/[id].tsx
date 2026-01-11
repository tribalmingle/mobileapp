import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { fetchUserProfile } from '@/api/users';
import { sendSwipe } from '@/api/discovery';
import GlassCard from '@/components/GlassCard';
import GoldButton from '@/components/universal/GoldButton';
import { colors, spacing, typography, borderRadius, gradients } from '@/theme';
import { User } from '@/types/user';

const { width } = Dimensions.get('window');

interface ProfileDetail extends Partial<User> {
  id: string;
  email?: string;
  name: string;
  age?: number;
  tribe?: string;
  city?: string;
  country?: string;
  bio?: string;
  photos: string[];
  interests?: string[];
  compatibility?: number;
  verified?: boolean;
  occupation?: string;
  education?: string;
  relationshipGoals?: string[];
}

function parseProfileParam(rawProfile?: string | string[]): ProfileDetail | null {
  if (!rawProfile) return null;
  const value = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;
  try {
    return JSON.parse(value) as ProfileDetail;
  } catch (error) {
    console.warn('Failed to parse profile param', error);
    return null;
  }
}

export default function ProfileDetailScreen() {
  const router = useRouter();
  const navigation = useNavigation<any>();
  const params = useLocalSearchParams();
  const rawProfile = parseProfileParam(params.profile);

  const initialProfile: ProfileDetail | null = useMemo(() => {
    if (rawProfile) {
      return {
        ...rawProfile,
        id: rawProfile.id || params.id?.toString() || '',
        name: rawProfile.name || 'Unknown',
        photos: rawProfile.photos && rawProfile.photos.length > 0 ? rawProfile.photos : [],
      };
    }
    return null;
  }, [rawProfile, params.id]);

  const [profile, setProfile] = useState<ProfileDetail | null>(initialProfile);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const [superLiked, setSuperLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(!initialProfile);
  const [error, setError] = useState<string | null>(null);
  const galleryRef = useRef<ScrollView>(null);

  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

  useEffect(() => {
    const load = async () => {
      if (!params.id) return;
      setIsLoading(true);
      setError(null);
      try {
        const loaded = await fetchUserProfile(String(params.id));
        if (loaded) {
          setProfile((prev) => ({
            ...(prev || {}),
            ...loaded,
            id: loaded.id || String(params.id),
            name: loaded.name || 'Unknown',
            photos: loaded.photos && loaded.photos.length > 0 ? loaded.photos : (prev?.photos || []),
          }));
        } else {
          setError('Profile not found');
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [params.id]);

  const handleScroll = (event: any) => {
    const x = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(x / width);
    if (newIndex !== photoIndex) {
      setPhotoIndex(newIndex);
    }
  };

  const jumpToPhoto = (idx: number) => {
    setPhotoIndex(idx);
    galleryRef.current?.scrollTo({ x: idx * width, animated: true });
  };

  const onAction = (label: string) => {
    Alert.alert(label, `${label} action coming soon.`);
  };

  const handleBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      router.replace('/search');
    }
  };

  const goToChat = () => {
    if (!profile) return;
    const targetId = profile.email || profile.id;
    router.push({
      pathname: '/(tabs)/chat/[id]',
      params: {
        id: targetId,
        name: profile.name,
        avatar: profile.photos?.[0],
      },
    });
  };

  const onLike = async () => {
    if (liked || superLiked) {
      Alert.alert('Already sent', 'You have already liked or super liked this member.');
      return;
    }
    if (!profile?.id) return;
    
    try {
      await sendSwipe(profile.id, 'like');
      setLiked(true);
      Alert.alert('Liked', 'We saved your like.');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to send like');
    }
  };

  const onSuperLike = async () => {
    if (liked || superLiked) {
      Alert.alert('Already sent', 'You have already liked or super liked this member.');
      return;
    }
    if (!profile?.id) return;
    
    try {
      await sendSwipe(profile.id, 'superlike');
      setSuperLiked(true);
      Alert.alert('Super like', 'Your super like has been sent.');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to send super like');
    }
  };

  if (isLoading) {
    return (
      <LinearGradient
        colors={gradients.hero.colors}
        start={gradients.hero.start}
        end={gradients.hero.end}
        style={styles.screen}
      >
        <SafeAreaView style={[styles.safeArea, styles.centered]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (error || !profile) {
    return (
      <LinearGradient
        colors={gradients.hero.colors}
        start={gradients.hero.start}
        end={gradients.hero.end}
        style={styles.screen}
      >
        <SafeAreaView style={[styles.safeArea, styles.centered]}>
          <Ionicons name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.errorTitle}>Profile Not Available</Text>
          <Text style={styles.errorText}>{error || 'This profile could not be loaded.'}</Text>
          <GoldButton
            title="Go Back"
            onPress={() => router.back()}
            style={styles.errorButton}
          />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const compatibility = profile.compatibility ?? 90;

  return (
    <LinearGradient
      colors={gradients.hero.colors}
      start={gradients.hero.start}
      end={gradients.hero.end}
      style={styles.screen}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.iconButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
            </TouchableOpacity>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconButton} onPress={() => onAction('Share profile')}>
                <Ionicons name="share-social" size={20} color={colors.text.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={() => onAction('Report')}>
                <Ionicons name="flag" size={20} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.gallery}>
            <ScrollView
              ref={galleryRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleScroll}
            >
              {profile.photos.map((uri, idx) => (
                <View key={`${uri}-${idx}`} style={styles.photoSlide}>
                  <Image source={{ uri }} style={styles.photo} />
                  <LinearGradient
                    colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.45)']}
                    style={styles.photoOverlay}
                  />
                </View>
              ))}
            </ScrollView>
            <View style={styles.indicators}>
              {profile.photos.map((_, idx) => (
                <View key={idx} style={[styles.indicator, idx === photoIndex && styles.indicatorActive]} />
              ))}
            </View>

            {profile.photos.length > 1 ? (
              <View style={styles.thumbnailRow}>
                {profile.photos.map((uri, idx) => (
                  <TouchableOpacity key={`${uri}-${idx}`} onPress={() => jumpToPhoto(idx)} activeOpacity={0.85}>
                    <Image
                      source={{ uri }}
                      style={[styles.thumbnail, idx === photoIndex && styles.thumbnailActive]}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>

          <View style={styles.body}>
            <GlassCard style={styles.infoCard} intensity={30} padding={spacing.lg}>
              <View style={styles.titleRow}>
                <View style={styles.nameBlock}>
                  <Text style={styles.nameText} numberOfLines={1}>
                    {profile.name}
                    {profile.age ? `, ${profile.age}` : ''}
                  </Text>
                  <View style={styles.metaRow}>
                    {profile.tribe && (
                      <View style={styles.pill}>
                        <Ionicons name="people" size={14} color={colors.primaryDark} />
                        <Text style={styles.pillText}>{profile.tribe} tribe</Text>
                      </View>
                    )}
                    {(profile.city || profile.country) && (
                      <View style={styles.pill}>
                        <Ionicons name="location" size={14} color={colors.primaryDark} />
                        <Text style={styles.pillText}>
                          {profile.city || 'City'}, {profile.country || 'Country'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.badgeStack}>
                  {profile.verified && (
                    <View style={styles.badge}>
                      <Ionicons name="shield-checkmark" size={16} color={colors.primaryDark} />
                      <Text style={styles.badgeText}>Verified</Text>
                    </View>
                  )}
                  <View style={styles.badge}>
                    <Ionicons name="sparkles" size={16} color={colors.primaryDark} />
                    <Text style={styles.badgeText}>{compatibility}% match</Text>
                  </View>
                </View>
              </View>

              <View style={styles.sectionRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{profile.relationshipGoals?.length || 2}</Text>
                  <Text style={styles.statLabel}>Intent signals</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{profile.interests?.length || 4}</Text>
                  <Text style={styles.statLabel}>Shared interests</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>Safe</Text>
                  <Text style={styles.statLabel}>Trust rating</Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>About</Text>
                <Text style={styles.bodyText}>
                  {profile.bio || 'Share a short introduction about faith, family, and what you are seeking.'}
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Details</Text>
                <DetailRow icon="briefcase" label="Work" value={profile.occupation || 'Add your role'} />
                <DetailRow icon="school" label="Education" value={profile.education || 'Add education'} />
                <DetailRow
                  icon="heart"
                  label="Looking for"
                  value={profile.relationshipGoals?.join(', ') || 'Meaningful connection'}
                />
              </View>

              {profile.interests && profile.interests.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Interests</Text>
                  <View style={styles.chipRow}>
                    {profile.interests.map((interest) => (
                      <View key={interest} style={styles.chip}>
                        <Text style={styles.chipText}>{interest}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </GlassCard>

            <View style={styles.ctaCard}>
              <Text style={styles.sectionTitle}>Reach out</Text>
              <Text style={styles.bodyText}>Send a like or start a conversation to make the first move.</Text>
              <View style={styles.ctaRow}>
                <TouchableOpacity style={[styles.actionButton, styles.passButton]} onPress={() => onAction('Pass')}>
                  <Ionicons name="close" size={24} color={colors.white} />
                  <Text style={styles.actionText}>Pass</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.superLikeButton, (liked || superLiked) && styles.actionDisabled]}
                  onPress={onSuperLike}
                  disabled={liked || superLiked}
                >
                  <Ionicons name="star" size={20} color={colors.primaryDark} />
                  <Text style={[styles.actionText, styles.darkText]}>{superLiked ? 'Super liked' : 'Super like'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.likeButton, (liked || superLiked) && styles.actionDisabled]}
                  onPress={onLike}
                  disabled={liked || superLiked}
                >
                  <Ionicons name="heart" size={22} color={colors.white} />
                  <Text style={styles.actionText}>{liked ? 'Liked' : 'Like'}</Text>
                </TouchableOpacity>
              </View>
              <GoldButton title="Send a message" onPress={goToChat} style={styles.messageButton} />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const DetailRow = ({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
}) => (
  <View style={styles.detailRow}>
    <View style={styles.detailIcon}>
      <Ionicons name={icon} size={16} color={colors.primaryDark} />
    </View>
    <View style={styles.detailCopy}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || 'Not provided'}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    ...typography.body,
    color: colors.text.secondary,
  },
  errorTitle: {
    marginTop: spacing.lg,
    ...typography.h2,
    color: colors.text.primary,
    textAlign: 'center',
  },
  errorText: {
    marginTop: spacing.sm,
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  errorButton: {
    marginTop: spacing.xl,
    minWidth: 200,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glass.medium,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glass.stroke,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  gallery: {
    width,
    height: width * 1.05,
  },
  photoSlide: {
    width,
    height: '100%',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
  },
  indicators: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  thumbnailRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.glass.medium,
  },
  thumbnailActive: {
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  indicator: {
    flex: 1,
    height: 4,
    backgroundColor: colors.glass.medium,
    borderRadius: 2,
  },
  indicatorActive: {
    backgroundColor: colors.white,
  },
  body: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  infoCard: {
    gap: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  nameBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  nameText: {
    ...typography.h2,
    color: colors.text.primary,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  pillText: {
    ...typography.small,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  badgeStack: {
    gap: spacing.xs,
    alignItems: 'flex-end',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.glass.light,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.glass.stroke,
  },
  badgeText: {
    ...typography.small,
    color: colors.text.primary,
    fontWeight: '600',
  },
  sectionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.glass.medium,
    alignItems: 'center',
  },
  statValue: {
    ...typography.h2,
    color: colors.text.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  bodyText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.glass.light,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.glass.stroke,
  },
  chipText: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
    paddingVertical: spacing.xs,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glass.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  detailValue: {
    ...typography.body,
    color: colors.text.primary,
  },
  ctaCard: {
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ctaRow: {
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
  passButton: {
    backgroundColor: colors.glass.medium,
  },
  likeButton: {
    backgroundColor: colors.sunset,
    borderColor: colors.sunset,
  },
  superLikeButton: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  actionDisabled: {
    opacity: 0.6,
  },
  actionText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '700',
  },
  darkText: {
    color: colors.primaryDark,
  },
  messageButton: {
    marginTop: spacing.sm,
  },
});
