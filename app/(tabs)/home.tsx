import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import UniversalBackground from '@/components/universal/UniversalBackground';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { colors, spacing, typography, borderRadius, gradients, shadows } from '@/theme';
import apiClient from '@/api/client';
import { fetchRecommendations, Recommendation } from '@/api/discovery';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PICK_CARD_WIDTH = 140;
const ACTIVE_AVATAR_SIZE = 52;

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);
  const unreadCount = useChatStore((s) => s.unreadCount);
  
  const [stats, setStats] = useState({ matches: 0, views: 0, likes: 0 });
  const [topPicks, setTopPicks] = useState<Recommendation[]>([]);
  const [activeNow, setActiveNow] = useState<Recommendation[]>([]);
  const [isLoadingPicks, setIsLoadingPicks] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setIsLoadingPicks(false);
      return;
    }

    const loadData = async () => {
      try {
        // Load stats
        const statsRes = await apiClient.get('/users/stats');
        if (statsRes.data.success && statsRes.data.stats) {
          setStats({
            matches: statsRes.data.stats.matches || 0,
            views: statsRes.data.stats.views || 0,
            likes: statsRes.data.stats.likes || 0,
          });
        }
        
        // Load top picks
        const { results } = await fetchRecommendations({}, 1, 12);
        setTopPicks(results.slice(0, 8));
        setActiveNow(results.filter((r: any) => r.isOnline).slice(0, 8));
      } catch (error) {
        console.error('Error loading home data:', error);
      } finally {
        setIsLoadingPicks(false);
      }
    };

    loadData();
  }, [isAuthenticated, token]);

  const getDisplayName = () => {
    if (!isAuthenticated || !user || loading) return 'there';

    const normalizeFirst = (value?: string) => {
      const cleaned = (value || '').trim();
      if (!cleaned) return '';
      const first = cleaned.split(' ')[0];
      return first ? `${first[0].toUpperCase()}${first.slice(1)}` : '';
    };

    const candidates = [
      normalizeFirst(user?.firstName),
      normalizeFirst(user?.fullName),
      normalizeFirst(user?.name),
      normalizeFirst(user?.displayName),
      normalizeFirst(user?.username),
    ].filter(Boolean);

    const nonEmailName = candidates.find((value) => !value.includes('@'));
    return nonEmailName || 'there';
  };

  const displayName = getDisplayName();
  const userTribe = user?.tribe || user?.heritage || '';

  // Verification status
  const hasIdVerification = Boolean(
    (user as any)?.idVerificationUrl ||
      (user as any)?.verificationIdUrl ||
      (user as any)?.idVerification?.url
  );
  const hasSelfieVerification = Boolean(
    (user as any)?.selfiePhoto ||
      (user as any)?.verificationSelfie
  );
  const isVerified = Boolean(
    (user as any)?.isVerified ||
      (user as any)?.verified ||
      (hasIdVerification && hasSelfieVerification)
  );
  
  // Dynamic hero message
  const getHeroMessage = () => {
    if (stats.matches > 0) return `You have ${stats.matches} new matches waiting ✨`;
    if (stats.likes > 0) return `${stats.likes} people liked your profile!`;
    if (stats.views > 0) return `Your profile got ${stats.views} views today`;
    return 'Someone special could be waiting for you';
  };

  const getHeroCTA = () => {
    if (stats.matches > 0) return { label: 'See Your Matches', route: '/(tabs)/matches' };
    if (stats.likes > 0) return { label: 'See Who Likes You', route: '/(tabs)/matches' };
    return { label: 'Start Discovering', route: '/(tabs)/discover' };
  };

  const heroCTA = getHeroCTA();

  const renderTopPickCard = (pick: Recommendation, index: number) => (
    <Pressable
      key={pick.id || index}
      style={styles.pickCard}
      onPress={() => router.push({ pathname: '/profile/[id]', params: { id: pick.id, profile: JSON.stringify(pick) } })}
    >
      <Image
        source={{ uri: pick.photos?.[0] || 'https://via.placeholder.com/140x180' }}
        style={styles.pickPhoto}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.pickGradient}
      >
        <View style={styles.pickInfo}>
          <Text style={styles.pickName} numberOfLines={1}>
            {pick.name?.split(' ')[0]}, {pick.age || '?'}
          </Text>
          {pick.compatibility && (
            <View style={styles.compatBadge}>
              <Text style={styles.compatText}>{pick.compatibility}%</Text>
            </View>
          )}
        </View>
        {pick.verified && (
          <View style={styles.verifiedDot}>
            <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 1, shadowColor: '#1877F2', shadowOpacity: 0.6, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 3 }}>
              <Ionicons name="checkmark-circle" size={16} color="#1877F2" />
            </View>
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );

  const renderActiveAvatar = (member: Recommendation, index: number) => (
    <Pressable
      key={member.id || index}
      style={styles.activeAvatarContainer}
      onPress={() => router.push({ pathname: '/profile/[id]', params: { id: member.id, profile: JSON.stringify(member) } })}
    >
      <Image
        source={{ uri: member.photos?.[0] || 'https://via.placeholder.com/52' }}
        style={styles.activeAvatar}
      />
      <View style={styles.onlineDot} />
    </Pressable>
  );

  return (
    <UniversalBackground
      scrollable
      contentContainerStyle={styles.scrollContent}
      showBackButton={false}
      onProfilePress={() => router.push('/(tabs)/profile')}
      onEditProfilePress={() => router.push('/(tabs)/profile')}
      onSettingsPress={() => router.push('/(tabs)/profile')}
    >
      {/* Hero Section */}
      <LinearGradient
        colors={['#5B2E91', '#3D1E61', '#1a0a2e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroContent}>
          <Text style={styles.heroGreeting}>Welcome back, {displayName}!</Text>
          
          {/* Verification Status Badge */}
          <View style={[styles.verificationBadge, isVerified ? styles.verificationBadgeVerified : styles.verificationBadgeUnverified]}>
            <Ionicons
              name={isVerified ? 'shield-checkmark' : 'alert-circle'}
              size={16}
              color={isVerified ? '#22C55E' : '#FBBF24'}
            />
            <Text style={[styles.verificationBadgeText, isVerified ? styles.verificationTextVerified : styles.verificationTextUnverified]}>
              {isVerified ? 'You are Verified' : 'You are not Verified'}
            </Text>
            {!isVerified && (
              <TouchableOpacity
                onPress={() => router.push('/setup')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.verifyNowLink}>Verify Now</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <Text style={styles.heroMessage}>{getHeroMessage()}</Text>
          
          <TouchableOpacity
            style={styles.heroCTA}
            onPress={() => router.push(heroCTA.route)}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#D4AF37', '#B8860B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.heroCTAGradient}
            >
              <Text style={styles.heroCTAText}>{heroCTA.label}</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.primaryDark} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        {/* Decorative elements */}
        <View style={styles.heroDecor}>
          <View style={[styles.decorCircle, styles.decorCircle1]} />
          <View style={[styles.decorCircle, styles.decorCircle2]} />
        </View>
      </LinearGradient>

      {/* Top Picks Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="sparkles" size={20} color={colors.secondary} />
            <Text style={styles.sectionTitle}>Today's Top Picks</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/discover')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.picksScroll}
        >
          {isLoadingPicks ? (
            Array(4).fill(0).map((_, i) => (
              <View key={i} style={[styles.pickCard, styles.pickCardLoading]} />
            ))
          ) : topPicks.length > 0 ? (
            topPicks.map(renderTopPickCard)
          ) : (
            <View style={styles.emptyPicks}>
              <Text style={styles.emptyPicksText}>Discovering matches for you...</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Active Now Section */}
      {activeNow.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.activeDotIndicator} />
              <Text style={styles.sectionTitle}>Active Now</Text>
              <Text style={styles.activeCount}>({activeNow.length})</Text>
            </View>
          </View>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activeScroll}
          >
            {activeNow.map(renderActiveAvatar)}
          </ScrollView>
        </View>
      )}

      {/* Tribe Widget */}
      {userTribe && (
        <TouchableOpacity
          style={styles.tribeWidget}
          onPress={() => router.push('/my-tribe')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['rgba(91, 46, 145, 0.3)', 'rgba(139, 92, 246, 0.15)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.tribeGradient}
          >
            <View style={styles.tribeIcon}>
              <Ionicons name="people-circle" size={32} color={colors.secondary} />
            </View>
            <View style={styles.tribeInfo}>
              <Text style={styles.tribeName}>{userTribe} Tribe</Text>
              <Text style={styles.tribeSubtext}>Connect with your community</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.text.secondary} />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Quick Actions - 2x2 Grid */}
      <View style={styles.quickActionsGrid}>
        <View style={styles.quickActionsGridRow}>
          <TouchableOpacity
            style={styles.quickActionGridCard}
            onPress={() => router.push('/guaranteed-dating')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#5B2E91', '#7C3AED']}
              style={styles.quickActionGridGradient}
            >
              <Ionicons name="heart-circle" size={28} color="#FFF" />
              <Text style={styles.quickActionGridLabel}>Guaranteed Dating</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionGridCard}
            onPress={() => router.push('/premium')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#D4AF37', '#B8860B']}
              style={styles.quickActionGridGradient}
            >
              <Ionicons name="star" size={28} color="#FFF" />
              <Text style={styles.quickActionGridLabel}>Premium</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        <View style={styles.quickActionsGridRow}>
          <TouchableOpacity
            style={styles.quickActionGridCard}
            onPress={() => router.push('/safety')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#22C55E', '#16A34A']}
              style={styles.quickActionGridGradient}
            >
              <Ionicons name="shield-checkmark" size={28} color="#FFF" />
              <Text style={styles.quickActionGridLabel}>Safety</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionGridCard}
            onPress={() => router.push('/tips')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#FF6B9D', '#C44569']}
              style={styles.quickActionGridGradient}
            >
              <Ionicons name="bulb" size={28} color="#FFF" />
              <Text style={styles.quickActionGridLabel}>Dating Tips</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </UniversalBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  
  // Hero Section
  heroCard: {
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
    ...shadows.lg,
  },
  heroContent: {
    padding: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
    zIndex: 1,
  },
  heroGreeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    lineHeight: 34,
  },
  // Verification badge
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
  },
  verificationBadgeVerified: {
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.35)',
  },
  verificationBadgeUnverified: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
  },
  verificationBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  verificationTextVerified: {
    color: '#22C55E',
  },
  verificationTextUnverified: {
    color: '#FBBF24',
  },
  verifyNowLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
    textDecorationLine: 'underline',
    marginLeft: spacing.xs,
  },
  heroMessage: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
  heroCTA: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  heroCTAGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  heroCTAText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  heroDecor: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '50%',
    overflow: 'hidden',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  decorCircle1: {
    width: 120,
    height: 120,
    top: -30,
    right: -30,
  },
  decorCircle2: {
    width: 80,
    height: 80,
    top: 60,
    right: 40,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },

  // Section Headers
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary,
  },

  // Top Picks
  picksScroll: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    gap: spacing.md,
  },
  pickCard: {
    width: PICK_CARD_WIDTH,
    height: 180,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  pickCardLoading: {
    backgroundColor: colors.glass.light,
  },
  pickPhoto: {
    width: '100%',
    height: '100%',
  },
  pickGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.sm,
    paddingTop: spacing.xl,
  },
  pickInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  pickName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
    flex: 1,
  },
  compatBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  compatText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  verifiedDot: {
    position: 'absolute',
    top: -spacing.xl,
    right: 0,
  },
  emptyPicks: {
    width: SCREEN_WIDTH - spacing.lg * 2,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.glass.light,
    borderRadius: borderRadius.lg,
  },
  emptyPicksText: {
    fontSize: 14,
    color: colors.text.secondary,
  },

  // Active Now
  activeDotIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  activeCount: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  activeScroll: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    gap: spacing.md,
  },
  activeAvatarContainer: {
    position: 'relative',
  },
  activeAvatar: {
    width: ACTIVE_AVATAR_SIZE,
    height: ACTIVE_AVATAR_SIZE,
    borderRadius: ACTIVE_AVATAR_SIZE / 2,
    borderWidth: 2.5,
    borderColor: colors.secondary,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: colors.background,
  },

  // Tribe Widget
  tribeWidget: {
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  tribeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: borderRadius.xl,
  },
  tribeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tribeInfo: {
    flex: 1,
  },
  tribeName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  tribeSubtext: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },

  // Quick Actions Grid 2x2
  quickActionsGrid: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  quickActionsGridRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickActionGridCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  quickActionGridGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    minHeight: 64,
  },
  quickActionGridLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
    flex: 1,
  },
});
