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
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { fetchUserProfile } from '@/api/users';
import { sendSwipe } from '@/api/discovery';
import { spacing } from '@/theme';
import { User } from '@/types/user';
import { inferOriginFromTribe } from '@/utils/tribeOrigin';
import { useAuthStore } from '@/store/authStore';

const { width } = Dimensions.get('window');

interface ProfileDetail extends Partial<User> {
  id: string;
  email?: string;
  name: string;
  age?: number;
  tribe?: string;
  city?: string;
  country?: string;
  heritage?: string;
  countryOfOrigin?: string;
  cityOfOrigin?: string;
  religion?: string;
  lookingFor?: string;
  bio?: string;
  photos: string[];
  interests?: string[];
  compatibility?: number;
  matchPercent?: number;
  matchReasons?: string[];
  matchBreakdown?: Array<{ key: string; label: string; score: number }>;
  loveLanguage?: string;
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
  const rawProfile = useMemo(() => parseProfileParam(params.profile), [params.profile]);

  // Always get the ID first - this is the source of truth
  const profileId = useMemo(() => {
    return params.id?.toString() || rawProfile?.id || '';
  }, [params.id, rawProfile?.id]);

  const initialProfile: ProfileDetail | null = useMemo(() => {
    if (rawProfile) {
      return {
        ...rawProfile,
        id: profileId,
        name: rawProfile.name || 'Unknown',
        photos: rawProfile.photos && rawProfile.photos.length > 0 ? rawProfile.photos : [],
      };
    }
    return null;
  }, [rawProfile, profileId]);

  const [profile, setProfile] = useState<ProfileDetail | null>(initialProfile);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const [superLiked, setSuperLiked] = useState(false);
  const [passed, setPassed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const galleryRef = useRef<ScrollView>(null);
  const [whyOpen, setWhyOpen] = useState(false);
  const currentUser = useAuthStore((state) => state.user);

  // Unified profile loading - ALWAYS fetch from API for fresh data
  useEffect(() => {
    const loadProfile = async () => {
      // No ID means we can't load anything
      if (!profileId) {
        setError('Profile ID is missing');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      // If we have initial data from params, use it immediately for faster UI
      if (initialProfile) {
        setProfile(initialProfile);
      }

      try {
        const loaded = await fetchUserProfile(profileId);
        if (loaded) {
          // Merge with existing data, preferring fresh API data
          setProfile((prev) => ({
            ...(prev || {}),
            ...loaded,
            id: loaded.id || profileId,
            name: loaded.name || prev?.name || 'Unknown',
            photos: loaded.photos && loaded.photos.length > 0 
              ? loaded.photos 
              : (prev?.photos || []),
            matchReasons: loaded.matchReasons ?? prev?.matchReasons,
            matchBreakdown: loaded.matchBreakdown ?? prev?.matchBreakdown,
          }));
          setError(null);
        }
        // If API returned null but we have initial data, just use that silently
      } catch (err: any) {
        // Silently handle - we use fallback data from navigation params
        // Only show error if we have absolutely no data at all
        if (!initialProfile && !profile) {
          setError(err?.message || 'Failed to load profile');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [profileId]); // Only depend on profileId, not initialProfile

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

  const onPass = async () => {
    if (passed || liked || superLiked) {
      Alert.alert('Already acted', 'You have already responded to this profile.');
      return;
    }
    if (!profile?.id) return;

    try {
      await sendSwipe(profile.id, 'pass');
      setPassed(true);
      // Navigate back after passing
      if (navigation?.canGoBack?.()) {
        navigation.goBack();
      } else {
        router.replace('/search');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to pass');
    }
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
    if (liked || superLiked || passed) {
      Alert.alert('Already acted', 'You have already responded to this profile.');
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
    if (liked || superLiked || passed) {
      Alert.alert('Already acted', 'You have already responded to this profile.');
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

  // Total possible matching criteria for compatibility computation
  const TOTAL_CRITERIA = 8; // tribe, city, country, origin, religion, love language, looking for, interests

  const sharedRows = useMemo(() => {
    if (!profile || !currentUser) return [] as Array<{ label: string; you: string; them: string }>;
    const normalize = (value?: string | null) => (value || '').trim().toLowerCase();
    const currentLookingFor =
      currentUser.lookingFor || (Array.isArray(currentUser.relationshipGoals) ? currentUser.relationshipGoals[0] : '');
    const theirLookingFor =
      profile.lookingFor || (Array.isArray(profile.relationshipGoals) ? profile.relationshipGoals[0] : '');
    const currentReligion = currentUser.religion || (currentUser as any).faith;
    const theirReligion = profile.religion || (profile as any).faith;
    const currentOrigin =
      currentUser.heritage || currentUser.countryOfOrigin || inferOriginFromTribe(currentUser.tribe);
    const theirOrigin =
      profile.heritage || profile.countryOfOrigin || inferOriginFromTribe(profile.tribe);

    const matches: Array<{ label: string; you: string; them: string }> = [];
    const pushIfSame = (label: string, you?: string | null, them?: string | null) => {
      if (!you || !them) return;
      if (normalize(you) === normalize(them)) {
        matches.push({ label, you, them });
      }
    };

    pushIfSame('Tribe', currentUser.tribe, profile.tribe);
    pushIfSame('City', currentUser.city, profile.city);
    pushIfSame('Country', currentUser.country, profile.country);
    if (currentOrigin || theirOrigin) {
      matches.push({ label: 'Origin', you: currentOrigin || '—', them: theirOrigin || '—' });
    }
    pushIfSame('Religion', currentReligion, theirReligion);
    pushIfSame('Love language', currentUser.loveLanguage, profile.loveLanguage);
    pushIfSame('Looking for', currentLookingFor, theirLookingFor);

    const youInterests = new Set((currentUser.interests || []).map((item) => normalize(item)).filter(Boolean));
    const sharedInterests = (profile.interests || []).filter((item) => youInterests.has(normalize(item)));
    if (sharedInterests.length) {
      matches.push({
        label: 'Shared interests',
        you: sharedInterests.slice(0, 4).join(', '),
        them: sharedInterests.slice(0, 4).join(', '),
      });
    }

    return matches;
  }, [profile, currentUser]);

  const compatibility = profile?.matchPercent ?? profile?.compatibility ?? Math.round((sharedRows.length / TOTAL_CRITERIA) * 100);
  const matchWhy = sharedRows.length > 0
    ? sharedRows.map((row) => row.label)
    : profile?.matchReasons?.length
      ? profile.matchReasons
      : profile?.matchBreakdown?.map((item) => item.label) || [];
  const verification = useMemo(() => {
    const hasId = Boolean(
      (profile as any)?.idVerificationUrl ||
        (profile as any)?.verificationIdUrl ||
        (profile as any)?.idVerification?.url
    );
    const hasSelfie = Boolean(
      (profile as any)?.selfiePhoto ||
        (profile as any)?.verificationSelfie
    );
    const isVerified = Boolean(
      (profile as any)?.isVerified ||
        (profile as any)?.verified ||
        (profile as any)?.verificationStatus === 'verified' ||
        (hasId && hasSelfie)
    );
    return { isVerified, hasId, hasSelfie };
  }, [profile]);

  // Retry function for error state
  const handleRetry = () => {
    if (!profileId) return;
    setIsLoading(true);
    setError(null);
    fetchUserProfile(profileId)
      .then((loaded) => {
        if (loaded) {
          setProfile({
            ...loaded,
            id: loaded.id || profileId,
            name: loaded.name || 'Unknown',
            photos: loaded.photos && loaded.photos.length > 0 ? loaded.photos : [],
          });
        } else {
          setError('Profile not found');
        }
      })
      .catch((err) => {
        setError(err?.message || 'Failed to load profile');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  if (isLoading && !profile) {
    return (
      <LinearGradient
        colors={['#0F0520', '#1A0B2E', '#261245']}
        style={styles.screen}
      >
        <SafeAreaView style={[styles.safeArea, styles.centered]}>
          <ActivityIndicator size="large" color="#D4AF37" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (error && !profile) {
    return (
      <LinearGradient
        colors={['#0F0520', '#1A0B2E', '#261245']}
        style={styles.screen}
      >
        <SafeAreaView style={[styles.safeArea, styles.centered]}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="person-circle-outline" size={64} color="rgba(255,255,255,0.4)" />
          </View>
          <Text style={styles.errorTitle}>Could Not Load Profile</Text>
          <Text style={styles.errorText}>{error}</Text>
          <View style={styles.errorActions}>
            <TouchableOpacity onPress={handleRetry} style={styles.errorRetryBtn}>
              <LinearGradient colors={['#D4AF37', '#B8860B']} style={styles.errorRetryGradient}>
                <Text style={styles.errorRetryText}>Try Again</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.errorBackLink} onPress={() => router.back()}>
              <Text style={styles.errorBackText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!profile) {
    return (
      <LinearGradient
        colors={['#0F0520', '#1A0B2E', '#261245']}
        style={styles.screen}
      >
        <SafeAreaView style={[styles.safeArea, styles.centered]}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Profile Not Available</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.errorRetryBtn}>
            <LinearGradient colors={['#D4AF37', '#B8860B']} style={styles.errorRetryGradient}>
              <Text style={styles.errorRetryText}>Go Back</Text>
            </LinearGradient>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#0F0520', '#1A0B2E', '#261245']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.screen}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
          {/* Floating Back + Actions */}
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.iconButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={22} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconButton} onPress={() => Alert.alert('Share', 'Share profile feature coming soon')}>
                <Ionicons name="share-social" size={20} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={() => Alert.alert('Report', 'Report feature coming soon')}>
                <Ionicons name="flag" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Photo Gallery */}
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
                    colors={['rgba(15,5,32,0)', 'rgba(15,5,32,0.85)']}
                    style={styles.photoOverlay}
                  />
                </View>
              ))}
            </ScrollView>
            {/* Photo indicators */}
            <View style={styles.indicators}>
              {profile.photos.map((_, idx) => (
                <View key={idx} style={[styles.indicator, idx === photoIndex && styles.indicatorActive]} />
              ))}
            </View>

            {/* Name overlay on photo */}
            <View style={styles.photoNameOverlay}>
              <View style={styles.nameRow}>
                <Text style={styles.heroName}>
                  {profile.name?.split(' ')[0] || profile.name}
                </Text>
                {profile.age ? <Text style={styles.heroAge}>, {profile.age}</Text> : null}
                {verification.isVerified && (
                  <View style={styles.verifiedBadgeInline}>
                    <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 1.5, shadowColor: '#1877F2', shadowOpacity: 0.6, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 4 }}>
                      <Ionicons name="checkmark-circle" size={24} color="#1877F2" />
                    </View>
                  </View>
                )}
              </View>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={14} color="#D4AF37" />
                <Text style={styles.heroLocation}>
                  {[profile.tribe, profile.city, profile.country].filter(Boolean).join(' · ')}
                </Text>
              </View>
            </View>
          </View>

          {/* Thumbnails */}
          {profile.photos.length > 1 && (
            <View style={styles.thumbnailRow}>
              {profile.photos.map((uri, idx) => (
                <TouchableOpacity key={`thumb-${idx}`} onPress={() => jumpToPhoto(idx)} activeOpacity={0.85}>
                  <Image
                    source={{ uri }}
                    style={[styles.thumbnail, idx === photoIndex && styles.thumbnailActive]}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.body}>
            {/* Verification Banner */}
            <LinearGradient
              colors={verification.isVerified
                ? ['rgba(34,197,94,0.15)', 'rgba(34,197,94,0.05)']
                : ['rgba(251,191,36,0.15)', 'rgba(251,191,36,0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.verificationBanner, verification.isVerified ? styles.verificationBannerVerified : styles.verificationBannerUnverified]}
            >
              <Ionicons
                name={verification.isVerified ? 'shield-checkmark' : 'alert-circle'}
                size={20}
                color={verification.isVerified ? '#22C55E' : '#FBBF24'}
              />
              <Text style={[styles.verificationBannerText, { color: verification.isVerified ? '#22C55E' : '#FBBF24' }]}>
                {verification.isVerified ? 'Identity Verified' : 'Not Yet Verified'}
              </Text>
              {!verification.isVerified && (
                <View style={styles.verificationWarningDot} />
              )}
            </LinearGradient>

            {/* Compatibility Card */}
            <LinearGradient
              colors={['rgba(124,58,237,0.2)', 'rgba(212,175,55,0.12)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.compatCard}
            >
              <View style={styles.compatHeader}>
                <View style={styles.compatScoreCircle}>
                  <Text style={styles.compatScoreText}>{compatibility}%</Text>
                </View>
                <View style={styles.compatMeta}>
                  <Text style={styles.compatTitle}>Compatible</Text>
                  {matchWhy.length > 0 && (
                    <Text style={styles.compatDesc} numberOfLines={2}>
                      {matchWhy.slice(0, 2).join(' and ')}
                    </Text>
                  )}
                </View>
              </View>
              <TouchableOpacity
                style={styles.compatButton}
                onPress={() => setWhyOpen(true)}
              >
                <Text style={styles.compatButtonText}>See why you match</Text>
                <Ionicons name="chevron-forward" size={14} color="#D4AF37" />
              </TouchableOpacity>
            </LinearGradient>

            {/* Quick Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <LinearGradient colors={['rgba(124,58,237,0.18)', 'rgba(124,58,237,0.06)']} style={styles.statGradient}>
                  <Text style={styles.statValue}>{profile.relationshipGoals?.length || 2}</Text>
                  <Text style={styles.statLabel}>Intent{'\n'}Signals</Text>
                </LinearGradient>
              </View>
              <View style={styles.statCard}>
                <LinearGradient colors={['rgba(212,175,55,0.18)', 'rgba(212,175,55,0.06)']} style={styles.statGradient}>
                  <Text style={styles.statValue}>{profile.interests?.length || 0}</Text>
                  <Text style={styles.statLabel}>Shared{'\n'}Interests</Text>
                </LinearGradient>
              </View>
              <View style={styles.statCard}>
                <LinearGradient colors={['rgba(34,197,94,0.18)', 'rgba(34,197,94,0.06)']} style={styles.statGradient}>
                  <Text style={styles.statValue}>Safe</Text>
                  <Text style={styles.statLabel}>Trust{'\n'}Rating</Text>
                </LinearGradient>
              </View>
            </View>

            {/* About Section */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="person" size={18} color="#D4AF37" />
                <Text style={styles.cardTitle}>About</Text>
              </View>
              <Text style={styles.aboutText}>
                {profile.bio || 'This user hasn\'t added a bio yet.'}
              </Text>
            </View>

            {/* Details Section */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="information-circle" size={18} color="#D4AF37" />
                <Text style={styles.cardTitle}>Details</Text>
              </View>
              <DetailRow icon="briefcase" label="Work" value={profile.occupation} />
              <DetailRow icon="school" label="Education" value={profile.education} />
              <DetailRow icon="heart" label="Looking for" value={profile.relationshipGoals?.join(', ') || profile.lookingFor} />
              <DetailRow icon="chatbubbles" label="Love language" value={profile.loveLanguage} />
              {profile.religion && <DetailRow icon="sparkles" label="Faith" value={profile.religion} />}
              {profile.maritalStatus && <DetailRow icon="people" label="Status" value={profile.maritalStatus} />}
            </View>

            {/* Interests */}
            {profile.interests && profile.interests.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="pricetag" size={18} color="#D4AF37" />
                  <Text style={styles.cardTitle}>Interests</Text>
                </View>
                <View style={styles.chipRow}>
                  {profile.interests.map((interest) => (
                    <LinearGradient
                      key={interest}
                      colors={['rgba(124,58,237,0.2)', 'rgba(167,139,250,0.12)']}
                      style={styles.chip}
                    >
                      <Text style={styles.chipText}>{interest}</Text>
                    </LinearGradient>
                  ))}
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionCard}>
              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.passBtn, passed && styles.actionDisabled]} onPress={onPass} disabled={passed}>
                  <Ionicons name="close" size={28} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.superLikeBtn, (liked || superLiked || passed) && styles.actionDisabled]}
                  onPress={onSuperLike}
                  disabled={liked || superLiked || passed}
                >
                  <LinearGradient colors={['#D4AF37', '#B8860B']} style={styles.actionBtnGradient}>
                    <Ionicons name="star" size={26} color="#FFF" />
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.likeBtn, (liked || superLiked || passed) && styles.actionDisabled]}
                  onPress={onLike}
                  disabled={liked || superLiked || passed}
                >
                  <LinearGradient colors={['#7C3AED', '#5B2E91']} style={styles.actionBtnGradient}>
                    <Ionicons name="heart" size={26} color="#FFF" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.messageBtn} onPress={goToChat} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#D4AF37', '#B8860B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.messageBtnGradient}
                >
                  <Ionicons name="chatbubble" size={18} color="#FFF" />
                  <Text style={styles.messageBtnText}>Send a Message</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Why Match Modal */}
      <Modal transparent visible={whyOpen} animationType="fade" onRequestClose={() => setWhyOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Why this match</Text>
              <TouchableOpacity onPress={() => setWhyOpen(false)}>
                <Ionicons name="close" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
            {sharedRows.length === 0 ? (
              <Text style={styles.modalEmpty}>We are still learning your preferences.</Text>
            ) : (
              <View style={styles.modalTable}>
                <View style={styles.modalRowHeader}>
                  <Text style={styles.modalHeaderCell}>Match</Text>
                  <Text style={styles.modalHeaderCell}>You</Text>
                  <Text style={styles.modalHeaderCell}>{profile?.name || 'Them'}</Text>
                </View>
                {sharedRows.map((row) => (
                  <View key={row.label} style={styles.modalRow}>
                    <Text style={styles.modalCellLabel}>{row.label}</Text>
                    <Text style={styles.modalCell}>{row.you}</Text>
                    <Text style={styles.modalCell}>{row.them}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </Modal>
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
}) => {
  if (!value) return null;
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={15} color="#D4AF37" />
      </View>
      <View style={styles.detailCopy}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
};

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
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
  },
  errorTitle: {
    marginTop: spacing.lg,
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
  },
  errorText: {
    marginTop: spacing.sm,
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  errorIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(124,58,237,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  errorActions: {
    gap: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  errorButton: {
    marginTop: spacing.sm,
    minWidth: 200,
  },
  errorBackLink: {
    paddingVertical: spacing.sm,
  },
  errorBackText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
  },
  errorRetryBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    minWidth: 180,
  },
  errorRetryGradient: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    borderRadius: 14,
  },
  errorRetryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },

  /* ─── Header ─── */
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(15,5,32,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  /* ─── Gallery ─── */
  gallery: {
    width,
    height: width * 1.15,
    position: 'relative',
  },
  photoSlide: {
    width,
    height: '100%',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
  },
  indicators: {
    position: 'absolute',
    top: spacing.md + 48,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    gap: 4,
  },
  indicator: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  indicatorActive: {
    backgroundColor: '#FFF',
  },
  photoNameOverlay: {
    position: 'absolute',
    bottom: 20,
    left: spacing.lg,
    right: spacing.lg,
  },

  /* ─── Thumbnails ─── */
  thumbnailRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    paddingBottom: 4,
  },
  thumbnail: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  thumbnailActive: {
    borderWidth: 2,
    borderColor: '#D4AF37',
  },

  /* ─── Name on photo ─── */
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroName: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  heroAge: {
    fontSize: 26,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.85)',
  },
  verifiedBadgeInline: {
    marginLeft: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  heroLocation: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },

  /* ─── Body ─── */
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 40,
    gap: 16,
  },

  /* ─── Verification Banner ─── */
  verificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  verificationBannerVerified: {
    borderColor: 'rgba(34,197,94,0.3)',
  },
  verificationBannerUnverified: {
    borderColor: 'rgba(251,191,36,0.3)',
  },
  verificationBannerText: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  verificationWarningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FBBF24',
  },

  /* ─── Compatibility Card ─── */
  compatCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.25)',
  },
  compatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  compatScoreCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(124,58,237,0.25)',
    borderWidth: 2,
    borderColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compatScoreText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFF',
  },
  compatMeta: {
    flex: 1,
    gap: 2,
  },
  compatTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  compatDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 18,
  },
  compatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    alignSelf: 'flex-end',
  },
  compatButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D4AF37',
  },

  /* ─── Stats Row ─── */
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statGradient: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 14,
  },

  /* ─── Card (About / Details / Interests) ─── */
  card: {
    backgroundColor: 'rgba(26,11,46,0.65)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.15)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
  },
  aboutText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 22,
  },

  /* ─── Detail Rows ─── */
  detailRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  detailIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(124,58,237,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCopy: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 15,
    color: '#FFF',
    fontWeight: '500',
    marginTop: 1,
  },

  /* ─── Chips ─── */
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.2)',
  },
  chipText: {
    fontSize: 13,
    color: '#FFF',
    fontWeight: '600',
  },

  /* ─── Action Buttons ─── */
  actionCard: {
    gap: 14,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  passBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  superLikeBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
  },
  likeBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
  },
  actionBtnGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionDisabled: {
    opacity: 0.45,
  },
  messageBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  messageBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  messageBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },

  /* ─── Modal ─── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#1A0B2E',
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.25)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  modalEmpty: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
  },
  modalTable: {
    gap: spacing.sm,
  },
  modalRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  modalHeaderCell: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
  modalCellLabel: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  modalCell: {
    flex: 1,
    fontSize: 14,
    color: '#FFF',
  },
});
