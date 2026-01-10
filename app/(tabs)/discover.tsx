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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import UniversalBackground from '@/components/universal/UniversalBackground';
import { colors, spacing, typography, borderRadius, shadows } from '@/theme';
import { fetchRecommendations, Recommendation, sendSwipe } from '@/api/discovery';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = 0.24 * width;

export default function DiscoverScreen() {
  const router = useRouter();
  const [feed, setFeed] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActioning, setIsActioning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const position = useRef(new Animated.ValueXY()).current;

  const topCard = feed[0];
  const nextCard = feed[1];
  const thirdCard = feed[2];

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

  const openProfile = (person: Recommendation) => {
    router.push({
      pathname: '/profile/[id]',
      params: {
        id: person.id,
        profile: JSON.stringify(person),
      },
    });
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
          setError(err?.message || 'Could not submit your action.');
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

  const renderStackedCard = (candidate: Recommendation | undefined, depth: number, align: 'left' | 'right') => {
    if (!candidate) return null;
    const scale = depth === 1 ? 0.9 : 0.85;
    const translateY = depth === 1 ? 10 : 20;
    const translateX = align === 'left' ? -22 : 22;
    const opacity = depth === 1 ? 0.9 : 0.65;
    return (
      <View
        style={[
          styles.backCardWrapper,
          {
            transform: [{ scale }, { translateY }, { translateX }],
            opacity,
          },
        ]}
        pointerEvents="none"
      >
        <ImageBackground
          source={{ uri: candidate.photos?.[0] }}
          style={styles.backCard}
          imageStyle={styles.backCardImage}
          blurRadius={14}
        >
          <View style={styles.backOverlay} />
        </ImageBackground>
      </View>
    );
  };

  const renderMainCard = () => {
    if (!topCard) return null;
    return (
      <Animated.View style={[styles.cardContainer, cardStyle]} {...panResponder.panHandlers}>
        <ImageBackground
          source={{ uri: topCard.photos?.[0] }}
          imageStyle={styles.cardImage}
          style={styles.cardSurface}
        >
          <View style={styles.overlay} />
          <View style={styles.cardContent}>
            <View style={styles.cardFooter}>
              <View style={styles.nameBlock}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {topCard.name}
                  {topCard.age ? `, ${topCard.age}` : ''}
                </Text>
                <Text style={styles.cardTribe}>{topCard.tribe || 'Tribe'}</Text>
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={16} color={colors.white} />
                  <Text style={styles.cardMeta} numberOfLines={1}>
                    {topCard.city || 'City'}, {topCard.country || 'Country'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

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

  const renderFooterAvatars = () => {
    const avatars = feed.slice(0, 7);
    if (avatars.length === 0) return null;
    return (
      <View style={styles.avatarRow}>
        {avatars.map((item) => (
          <TouchableOpacity key={item.id} onPress={() => openProfile(item)}>
            <View style={styles.avatarRing}>
              <Image source={{ uri: item.photos?.[0] }} style={styles.avatar} />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.secondary} />
          <Text style={styles.loadingText}>Fetching recommendations...</Text>
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

        <View style={styles.deck}>
          {renderStackedCard(thirdCard, 2, 'right')}
          {renderStackedCard(nextCard, 1, 'left')}
          {renderMainCard()}
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.circleButton, styles.nopeButton]}
            onPress={() => animateSwipe(-width * 1.1, 'pass')}
            disabled={isActioning || !topCard}
          >
            <Ionicons name="close" size={32} color="#F04D4D" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.circleButton, styles.likeButton]}
            onPress={() => animateSwipe(width * 1.1, 'like')}
            disabled={isActioning || !topCard}
          >
            <Ionicons name="heart" size={32} color={colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.recentRow}>
          <Text style={styles.recentTitle}>Recent matchings</Text>
          {renderFooterAvatars()}
        </View>
      </>
    );
  };

  return (
    <UniversalBackground
      scrollable
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
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  headerRow: {
    gap: 6,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: colors.white,
    letterSpacing: 1,
  },
  deck: {
    height: 500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    width: '90%',
    height: 420,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#B6B6B6',
    ...shadows.lg,
  },
  cardSurface: {
    flex: 1,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  cardImage: {
    borderRadius: borderRadius.xl,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  matchBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  matchText: {
    ...typography.small,
    color: colors.white,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    gap: spacing.xs,
  },
  nameBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  cardName: {
    ...typography.h1,
    color: colors.white,
    fontWeight: '800',
  },
  cardMeta: {
    ...typography.body,
    color: colors.white,
    opacity: 0.9,
  },
  cardTribe: {
    ...typography.body,
    color: '#F18A34',
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  viewProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  viewProfileText: {
    ...typography.small,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xl,
    marginTop: spacing.md,
  },
  circleButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  likeButton: {
    backgroundColor: '#34C759',
    borderWidth: 6,
    borderColor: '#2AA64A',
  },
  nopeButton: {
    backgroundColor: '#4A62F3',
    borderWidth: 6,
    borderColor: '#C82926',
  },
  backCardWrapper: {
    width: '78%',
    height: 390,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    position: 'absolute',
  },
  backCard: {
    flex: 1,
    borderRadius: borderRadius.xl,
  },
  backCardImage: {
    borderRadius: borderRadius.xl,
  },
  backOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  stamp: {
    position: 'absolute',
    top: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 2,
  },
  likeStamp: {
    right: spacing.lg,
    borderColor: '#21C16B',
  },
  nopeStamp: {
    left: spacing.lg,
    borderColor: '#D32F2F',
  },
  stampText: {
    ...typography.body,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 1,
  },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    flexWrap: 'nowrap',
  },
  avatarRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    padding: 2,
    backgroundColor: '#F18A34',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#1C1633',
    backgroundColor: colors.surface,
  },
  recentRow: {
    gap: spacing.xs,
  },
  recentTitle: {
    ...typography.h4,
    color: colors.white,
  },
  errorCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
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
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
  },
});
