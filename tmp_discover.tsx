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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, borderRadius, shadows } from '@/theme';
import { fetchRecommendations, Recommendation, sendSwipe } from '@/api/discovery';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = 0.28 * width;

export default function DiscoverScreen() {
  const router = useRouter();
  const [feed, setFeed] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActioning, setIsActioning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const position = useRef(new Animated.ValueXY()).current;

  const topCard = feed[0];
  const nextCard = feed[1];

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
    [position, feed]
  );

  const rotate = position.x.interpolate({
    inputRange: [-width, 0, width],
    outputRange: ['-10deg', '0deg', '10deg'],
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

  const renderHeader = (
    <View style={styles.headerBar}>
      <Image source={require('../../assets/logop.webp')} style={styles.logo} resizeMode="contain" />
      <View style={styles.headerIcons}>
        <TouchableOpacity onPress={() => router.push('/search')} style={styles.iconPill}>
          <Ionicons name="search" size={22} color={colors.primaryDark} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.iconPill}>
          <Ionicons name="notifications-outline" size={22} color={colors.primaryDark} />
          <View style={styles.badgeCircle}>
            <Text style={styles.badgeText}>3</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.iconPill}>
          <Ionicons name="person" size={22} color={colors.primaryDark} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStackedCard = (candidate: Recommendation | undefined) => {
    if (!candidate) return null;
    return (
      <View style={styles.backCardWrapper}>
        <ImageBackground
          source={{ uri: candidate.photos?.[0] }}
          style={styles.backCard}
          imageStyle={styles.backCardImage}
          blurRadius={12}
        >
          <View style={styles.backOverlay} />
        </ImageBackground>
      </View>
    );
  };

  const renderMainCard = () => {
    if (!topCard) return null;
    return (
      <Animated.View style={[styles.card, cardStyle]} {...panResponder.panHandlers}>
        <ImageBackground
          source={{ uri: topCard.photos?.[0] }}
          imageStyle={styles.cardImage}
          style={styles.card}
        >
          <View style={styles.overlay} />
          <View style={styles.cardContent}>
            <View style={styles.matchBadge}>
              <Ionicons name="sparkles" size={14} color={colors.white} />
              <Text style={styles.matchText}>{Math.round(topCard.compatibility ?? 90)}% match</Text>
            </View>
            <View style={styles.cardInfo}>
              <View>
                <Text style={styles.cardName}>{topCard.name}{topCard.age ? `, ${topCard.age}` : ''}</Text>
                <Text style={styles.cardMeta}>{topCard.tribe || 'Tribe'}</Text>
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={16} color={colors.white} />
                  <Text style={styles.cardMeta}>{topCard.city || 'City'}, {topCard.country || 'Country'}</Text>
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
    const avatars = feed.slice(0, 8);
    if (avatars.length === 0) return null;
    return (
      <View style={styles.avatarRow}>
        {avatars.map((item) => (
          <TouchableOpacity key={item.id} onPress={() => openProfile(item)}>
            <Image source={{ uri: item.photos?.[0] }} style={styles.avatar} />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.screen}>
        {renderHeader}
        <View style={[styles.centered, { marginTop: spacing.xl }]}>
          <ActivityIndicator size="large" color={colors.secondary} />
          <Text style={styles.loadingText}>Fetching recommendations...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {renderHeader}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>DISCOVER</Text>

        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadFeed} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {renderStackedCard(nextCard)}
        {renderMainCard()}

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.circleButton, styles.nopeButton]}
            onPress={() => animateSwipe(-width * 1.2, 'pass')}
            disabled={isActioning}
          >
            <Ionicons name="close" size={28} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.circleButton, styles.likeButton]}
            onPress={() => animateSwipe(width * 1.2, 'like')}
            disabled={isActioning}
          >
            <Ionicons name="heart" size={28} color={colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.recentRow}>
          <Text style={styles.recentTitle}>Recent matchings</Text>
          {renderFooterAvatars()}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0F0A21',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  headerBar: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E4BB23',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    ...shadows.md,
  },
  logo: {
    width: 160,
    height: 44,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconPill: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeCircle: {
    position: 'absolute',
    top: 2,
    right: 4,
    backgroundColor: colors.error,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
  },
  title: {
    ...typography.h2,
    color: colors.white,
    letterSpacing: 1,
    marginTop: spacing.md,
  },
  card: {
    height: 440,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
    ...shadows.lg,
  },
  cardImage: {
    borderRadius: borderRadius.xl,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing.lg,
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
  cardInfo: {
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
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.lg,
  },
  circleButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  likeButton: {
    backgroundColor: '#21C16B',
  },
  nopeButton: {
    backgroundColor: '#1D2156',
  },
  backCardWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: -1,
  },
  backCard: {
    width: '95%',
    height: 420,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
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
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#F18A34',
    backgroundColor: colors.surface,
  },
  recentRow: {
    marginTop: spacing.md,
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
  },
  retryText: {
    ...typography.small,
    color: colors.white,
    fontWeight: '700',
    textAlign: 'center',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.body,
    color: colors.white,
  },
});
