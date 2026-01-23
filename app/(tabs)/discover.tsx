import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Animated,
  PanResponder,
  Image,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import UniversalBackground from '@/components/universal/UniversalBackground';
import { colors, spacing, typography, borderRadius, shadows } from '@/theme';
import { fetchRecommendations, Recommendation, sendSwipe } from '@/api/discovery';
import { useAuthStore } from '@/store/authStore';
import { inferOriginFromTribe } from '@/utils/tribeOrigin';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = 0.24 * width;

export default function DiscoverScreen() {
  const router = useRouter();
  const [feed, setFeed] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActioning, setIsActioning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentMatches, setRecentMatches] = useState<Recommendation[]>([]);
  const [whyProfile, setWhyProfile] = useState<Recommendation | null>(null);
  const position = useRef(new Animated.ValueXY()).current;
  const currentUser = useAuthStore((state) => state.user);

  const topCard = feed[0];
  const leftCard = feed[1];
  const rightCard = feed[2];

  const loadFeed = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { results } = await fetchRecommendations();
      setFeed(results);
    } catch (err: any) {
      setError(err?.message || 'Could not load recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  useEffect(() => {
    setRecentMatches(feed.slice(0, 7));
  }, [feed]);

  const openProfile = (person: Recommendation) => {
    router.push({
      pathname: '/profile/[id]',
      params: {
        id: person.id,
        profile: JSON.stringify(person),
      },
    });
  };

  const showMatchWhy = (person: Recommendation) => {
    setWhyProfile(person);
  };

  const sharedRows = useMemo(() => {
    if (!whyProfile || !currentUser) return [] as Array<{ label: string; you: string; them: string }>;
    const normalize = (value?: string | null) => (value || '').trim().toLowerCase();
    const currentLookingFor =
      currentUser.lookingFor || (Array.isArray(currentUser.relationshipGoals) ? currentUser.relationshipGoals[0] : '');
    const theirLookingFor =
      whyProfile.lookingFor || (Array.isArray(whyProfile.relationshipGoals) ? whyProfile.relationshipGoals[0] : '');
    const currentReligion = currentUser.religion || (currentUser as any).faith;
    const theirReligion = whyProfile.religion || (whyProfile as any).faith;
    const currentOrigin =
      currentUser.heritage || currentUser.countryOfOrigin || inferOriginFromTribe(currentUser.tribe);
    const theirOrigin =
      whyProfile.heritage || whyProfile.countryOfOrigin || inferOriginFromTribe(whyProfile.tribe);

    const matches: Array<{ label: string; you: string; them: string }> = [];
    const pushIfSame = (label: string, you?: string | null, them?: string | null) => {
      if (!you || !them) return;
      if (normalize(you) === normalize(them)) {
        matches.push({ label, you, them });
      }
    };

    pushIfSame('Tribe', currentUser.tribe, whyProfile.tribe);
    pushIfSame('City', currentUser.city, whyProfile.city);
    pushIfSame('Country', currentUser.country, whyProfile.country);
    if (currentOrigin || theirOrigin) {
      matches.push({ label: 'Origin', you: currentOrigin || '—', them: theirOrigin || '—' });
    }
    pushIfSame('Religion', currentReligion, theirReligion);
    pushIfSame('Love language', currentUser.loveLanguage, whyProfile.loveLanguage);
    pushIfSame('Looking for', currentLookingFor, theirLookingFor);

    const youInterests = new Set((currentUser.interests || []).map((item) => normalize(item)).filter(Boolean));
    const sharedInterests = (whyProfile.interests || []).filter((item) => youInterests.has(normalize(item)));
    if (sharedInterests.length) {
      matches.push({
        label: 'Shared interests',
        you: sharedInterests.slice(0, 4).join(', '),
        them: sharedInterests.slice(0, 4).join(', '),
      });
    }

    return matches;
  }, [whyProfile, currentUser]);

  const focusCard = (personId: string) => {
    setFeed((prev) => {
      const index = prev.findIndex((item) => item.id === personId);
      if (index <= 0) return prev;
      const selected = prev[index];
      const next = [selected, ...prev.slice(0, index), ...prev.slice(index + 1)];
      return next;
    });
    position.setValue({ x: 0, y: 0 });
  };

  const advance = () => {
    position.setValue({ x: 0, y: 0 });
    setFeed((prev) => prev.slice(1));
  };

  const animateSwipe = (toX: number, action: 'like' | 'pass' | 'superlike') => {
    Animated.timing(position, {
      toValue: { x: toX, y: 0 },
      duration: 180,
      useNativeDriver: true,
    }).start(async () => {
      const person = feed[0];
      if (person) {
        setIsActioning(true);
        try {
          await sendSwipe(person.id, action);
        } catch (err: any) {
          const message = err?.response?.data?.message || err?.message || '';
          const status = err?.response?.status;
          if (!(status === 400 && /already liked/i.test(message))) {
            setError(message || 'Could not submit your action.');
          }
        } finally {
          setIsActioning(false);
        }
      }
      advance();
    });
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_evt, gesture) => Math.abs(gesture.dx) > 8,
        onPanResponderMove: Animated.event([null, { dx: position.x, dy: position.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: (_evt, gesture) => {
          if (gesture.dx > SWIPE_THRESHOLD) {
            animateSwipe(width * 1.2, 'like');
            return;
          }
          if (gesture.dx < -SWIPE_THRESHOLD) {
            animateSwipe(-width * 1.2, 'pass');
            return;
          }
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
            friction: 5,
          }).start();
        },
      }),
    [position]
  );

  const rotate = position.x.interpolate({
    inputRange: [-width, 0, width],
    outputRange: ['-8deg', '0deg', '8deg'],
  });

  const cardStyle = {
    transform: [...position.getTranslateTransform(), { rotate }],
  };

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Render side cards (left and right) - 25% smaller than active, centered
  const renderSideCard = (candidate: Recommendation | undefined, position: 'left' | 'right') => {
    if (!candidate) return null;
    
    // Side cards should be 75% of active card (25% smaller)
    const activeCardWidthPercent = 0.614;
    const sideCardScale = 0.75; // 25% smaller
    const sideCardWidthPercent = activeCardWidthPercent * sideCardScale;
    const sideCardWidth = width * sideCardWidthPercent;
    
    return (
      <View
        style={[
          styles.sideCardContainer,
          {
            width: sideCardWidth,
            height: '75%', // 25% smaller in height too
            left: position === 'left' ? -sideCardWidth * 0.35 : undefined,
            right: position === 'right' ? -sideCardWidth * 0.35 : undefined,
          },
        ]}
        pointerEvents="none"
      >
        <ImageBackground
          source={{ uri: candidate.photos?.[0] }}
          style={styles.sideCard}
          imageStyle={styles.sideCardImage}
        >
          {/* Reduced blur for better visibility */}
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          {/* Lighter overlay */}
          <View style={styles.sideCardOverlay} />
        </ImageBackground>
      </View>
    );
  };

  // Render the main center card with glassmorphism and premium styling
  const renderMainCard = () => {
    if (!topCard) return null;
    const messageLabel =
          topCard.gender === 'male'
            ? 'Chat him'
            : topCard.gender === 'female'
              ? 'Chat her'
              : 'Chat';
    return (
      <Animated.View style={[styles.mainCardContainer, cardStyle]} {...panResponder.panHandlers}>
        <ImageBackground
          source={{ uri: topCard.photos?.[0] }}
          imageStyle={styles.mainCardImage}
          style={styles.mainCardSurface}
        >
          {/* Bottom gradient for text readability */}
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.85)']}
            style={styles.gradientOverlay}
          />
          
          {/* Premium matching badge */}
          <View style={styles.matchBadge}>
            <Ionicons name="analytics" size={14} color="#FFD700" />
            <Text style={styles.matchText}>
              {topCard.matchPercent || topCard.compatibility || 95}% Match
            </Text>
          </View>
          <TouchableOpacity
            style={styles.matchWhy}
            onPress={() => showMatchWhy(topCard)}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.matchWhyText}>See why</Text>
            <Ionicons name="chevron-forward" size={12} color="#FFFFFF" />
          </TouchableOpacity>
          
          {/* Profile details at bottom */}
          <View style={styles.cardContent}>
            <View style={styles.profileInfo}>
              <Text style={styles.nameAge} numberOfLines={1}>
                {topCard.name}{topCard.age ? `, ${topCard.age}` : ''}
              </Text>
              <View style={styles.tribeRow}>
                <Text style={styles.tribe} numberOfLines={1}>
                  {topCard.tribe || 'Swahili'}
                </Text>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.messagePill}
                    onPress={() => {
                      const targetId = topCard.email || topCard.id;
                      if (!targetId) return;
                      router.push({
                        pathname: '/(tabs)/chat/[id]',
                        params: {
                          id: targetId,
                          name: topCard.name,
                          avatar: topCard.photos?.[0] || '',
                        },
                      });
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.messageText}>{messageLabel}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.profilePill}
                    onPress={() => openProfile(topCard)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.profileText}>Profile</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.locationRow}>
                <Ionicons name="location-sharp" size={13} color="rgba(255,255,255,0.85)" />
                <Text style={styles.location} numberOfLines={1}>
                  {topCard.city || 'Nairobi'}, {topCard.country || 'Kenya'}
                </Text>
              </View>
            </View>
          </View>

          {/* Swipe feedback stamps */}
          <Animated.View style={[styles.stamp, styles.likeStamp, { opacity: likeOpacity }]}>
            <Text style={styles.stampText}>LIKE</Text>
          </Animated.View>
          <Animated.View style={[styles.stamp, styles.nopeStamp, { opacity: nopeOpacity }]}>
            <Text style={styles.stampText}>NOPE</Text>
          </Animated.View>
        </ImageBackground>
      </Animated.View>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.secondary} />
          <Text style={styles.loadingText}>Finding your matches...</Text>
        </View>
      );
    }

    if (!topCard && !isLoading) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="heart-dislike-outline" size={64} color={colors.text.secondary} />
          <Text style={styles.emptyText}>No more profiles</Text>
          <TouchableOpacity onPress={loadFeed} style={styles.reloadButton}>
            <Text style={styles.reloadText}>Reload</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <>
        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadFeed} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.carouselContainer}>
          <View style={styles.deck}>
            {renderSideCard(leftCard, 'left')}
            {renderSideCard(rightCard, 'right')}
            {renderMainCard()}
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => animateSwipe(-width * 1.2, 'pass')}
              disabled={isActioning || !topCard}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#4A90E2', '#5C6BC0']}
                style={styles.rejectGradient}
              >
                <Ionicons name="close" size={32} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.likeButton]}
              onPress={() => animateSwipe(width * 1.2, 'like')}
              disabled={isActioning || !topCard}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#FF6B95', '#FF8E6E']}
                style={styles.likeGradient}
              >
                <Ionicons name="heart" size={30} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent matchings section */}
        <View style={styles.recentSection}>
          <Text style={styles.recentTitle}>Recent matchings</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentScrollContent}
          >
            {recentMatches.map((match, index) => (
              <TouchableOpacity
                key={match.id || index}
                style={styles.recentAvatar}
                onPress={() => focusCard(match.id)}
              >
                <Image
                  source={{ uri: match.photos?.[0] }}
                  style={styles.recentImage}
                  resizeMode="cover"
                />
                <View style={styles.recentBorder} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <Modal transparent visible={!!whyProfile} animationType="fade" onRequestClose={() => setWhyProfile(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Why this match</Text>
                <TouchableOpacity onPress={() => setWhyProfile(null)}>
                  <Ionicons name="close" size={20} color={colors.text.primary} />
                </TouchableOpacity>
              </View>
              {sharedRows.length === 0 ? (
                <Text style={styles.modalEmpty}>We are still learning your preferences.</Text>
              ) : (
                <View style={styles.modalTable}>
                  <View style={styles.modalRowHeader}>
                    <Text style={styles.modalHeaderCell}>Match</Text>
                    <Text style={styles.modalHeaderCell}>You</Text>
                    <Text style={styles.modalHeaderCell}>{whyProfile?.name || 'Them'}</Text>
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
      </>
    );
  };

  return (
    <UniversalBackground
      scrollable={false}
      contentContainerStyle={styles.content}
      onProfilePress={() => router.push('/(tabs)/profile')}
      onEditProfilePress={() => router.push('/(tabs)/profile')}
      onSettingsPress={() => router.push('/(tabs)/profile')}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>DISCOVER</Text>
      </View>
      {renderContent()}
    </UniversalBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  headerRow: {
    alignItems: 'center',
   marginTop: -19,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  
  // Carousel container - holds cards and actions
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  
  // Card deck container - portrait ID card proportions
  deck: {
    width: '100%',
    height: height * 0.42,
    maxHeight: 380,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  
  // Side cards (left and right) - 25% smaller, centered with glass border
  sideCardContainer: {
    position: 'absolute',
    borderRadius: 20,
    overflow: 'hidden',
    zIndex: 1,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  sideCard: {
    flex: 1,
  },
  sideCardImage: {
    borderRadius: 20,
  },
  sideCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  
  // Main center card - 30% smaller total (85% * 0.85 * 0.85 = 61.4%)
  mainCardContainer: {
    width: '61.4%', // 72.25% * 0.85 = 15% smaller again
    height: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    zIndex: 10,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    ...shadows.lg,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 15,
  },
  mainCardSurface: {
    flex: 1,
  },
  mainCardImage: {
    borderRadius: 24,
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 200,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  
  // Match percentage badge
  matchBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(20,20,20,0.8)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.35)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  matchText: {
    ...typography.body,
    color: '#FFD700',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.2,
  },
  matchWhy: {
    position: 'absolute',
    top: 52,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  matchWhyText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  modalEmpty: {
    ...typography.body,
    color: colors.text.secondary,
  },
  modalTable: {
    gap: spacing.sm,
  },
  modalRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  modalHeaderCell: {
    flex: 1,
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  modalCellLabel: {
    flex: 1,
    ...typography.caption,
    color: colors.text.secondary,
  },
  modalCell: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
  },
  
  // Profile info at bottom of card
  cardContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.lg,
    paddingBottom: spacing.lg,
  },
  profileInfo: {
    gap: 3,
  },
  nameAge: {
    ...typography.h1,
    color: colors.white,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  tribe: {
    ...typography.body,
    color: '#FF8C5A',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  tribeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  messagePill: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  messageText: {
    ...typography.small,
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  profilePill: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  profileText: {
    ...typography.small,
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  location: {
    ...typography.body,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  
  // Swipe feedback stamps
  stamp: {
    position: 'absolute',
    top: 50,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 4,
    transform: [{ rotate: '-15deg' }],
  },
  likeStamp: {
    right: 40,
    borderColor: '#34C759',
    backgroundColor: 'rgba(52,199,89,0.15)',
  },
  nopeStamp: {
    left: 40,
    borderColor: '#FF3B30',
    backgroundColor: 'rgba(255,59,48,0.15)',
  },
  stampText: {
    ...typography.h2,
    fontWeight: '900',
    color: colors.white,
    fontSize: 32,
    letterSpacing: 2,
  },
  
  // Action buttons - circular with gradients
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 55,
    paddingTop: -spacing.lg,
  },
  actionButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    overflow: 'hidden',
    ...shadows.md,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  rejectButton: {
    borderWidth: 3,
    borderColor: '#E53935',
  },
  rejectGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  likeButton: {
    borderWidth: 3,
    borderColor: '#43A047',
  },
  likeGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Recent matchings section
  recentSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
    marginTop: spacing.xl,
  },
  recentTitle: {
    ...typography.h3,
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  recentScrollContent: {
    gap: 12,
    paddingRight: spacing.lg,
  },
  recentAvatar: {
    width: 50,
    height: 50,
    borderRadius: 36,
    position: 'relative',
  },
  recentImage: {
    width: 50,
    height: 50,
    borderRadius: 36,
  },
  recentBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 36,
    borderWidth: 2.5,
    borderColor: '#F18A34',
  },
  
  // Loading and error states
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  emptyText: {
    ...typography.h3,
    color: colors.text.secondary,
  },
  reloadButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  reloadText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '700',
  },
  errorCard: {
    backgroundColor: 'rgba(255,59,48,0.15)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.5)',
    marginBottom: spacing.md,
    marginHorizontal: spacing.lg,
  },
  errorText: {
    ...typography.body,
    color: '#FF3B30',
    fontWeight: '600',
  },
  retryButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  retryText: {
    ...typography.small,
    color: colors.white,
    fontWeight: '700',
  },
});
