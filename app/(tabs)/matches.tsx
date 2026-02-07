import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import UniversalBackground from '@/components/universal/UniversalBackground';
import GlassCard from '@/components/GlassCard';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { acceptLike, declineLike, fetchIncomingLikes, fetchMatches, fetchSentLikes, fetchViews, MatchUser } from '@/api/matches';
import { useAuthStore } from '@/store/authStore';

type InboxTab = 'incoming' | 'sent' | 'views' | 'matches';

const tabPalette: Record<InboxTab, { bg: string; border: string; active: string; text: string; textActive: string }> = {
  incoming: {
    bg: 'rgba(212, 175, 55, 0.18)',
    border: 'rgba(212, 175, 55, 0.45)',
    active: '#D4AF37',
    text: colors.text.primary,
    textActive: colors.dark.bg,
  },
  sent: {
    bg: 'rgba(91, 46, 145, 0.20)',
    border: '#7B4FB8',
    active: '#5B2E91',
    text: colors.text.primary,
    textActive: colors.text.primary,
  },
  views: {
    bg: 'rgba(52, 211, 153, 0.16)',
    border: '#34D399',
    active: '#10B981',
    text: colors.text.primary,
    textActive: colors.dark.bg,
  },
  matches: {
    bg: 'rgba(255, 112, 67, 0.16)',
    border: '#FF7043',
    active: '#FF8C5A',
    text: colors.text.primary,
    textActive: colors.dark.bg,
  },
};

const MatchCard = ({ item, onViewProfile, onChat }: { item: MatchUser; onViewProfile: () => void; onChat: () => void }) => (
  <TouchableOpacity activeOpacity={0.9} onPress={onViewProfile}>
    <GlassCard style={styles.card} intensity={30} padding={spacing.md}>
      <View style={styles.row}>
        <Image source={{ uri: item.photo }} style={styles.avatar} />
        <View style={styles.meta}>
          <View style={styles.rowBetween}>
            <Text style={styles.name}>{item.name}{item.age ? `, ${item.age}` : ''}</Text>
            <View style={styles.statusPill}>
              <Ionicons name="sparkles" size={14} color={colors.primaryDark} />
              <Text style={styles.statusText}>{item.status || 'New match'}</Text>
            </View>
          </View>
          <Text style={styles.subline}>{item.city || 'City'} • {item.tribe || 'Tribe'}</Text>
          <Text style={styles.vibe}>{item.bio || 'Shared vibe detected'}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionButton, styles.secondary]} onPress={onViewProfile}>
          <Ionicons name="person" size={18} color={colors.text.primary} />
          <Text style={styles.actionText}>View profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.primary]} onPress={onChat}>
          <Ionicons name="chatbubbles" size={18} color={colors.primaryDark} />
          <Text style={[styles.actionText, styles.primaryText]}>Chat</Text>
        </TouchableOpacity>
      </View>
    </GlassCard>
  </TouchableOpacity>
);

export default function MatchesScreen() {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const [matches, setMatches] = useState<MatchUser[]>([]);
  const [incomingLikes, setIncomingLikes] = useState<MatchUser[]>([]);
  const [sentLikes, setSentLikes] = useState<MatchUser[]>([]);
  const [views, setViews] = useState<MatchUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [tab, setTab] = useState<InboxTab>('incoming');

  const getPriority = (candidate: MatchUser) => {
    if (!currentUser) return 4;
    const normalize = (value?: string | null) => (value || '').trim().toLowerCase();
    const sameTribe =
      currentUser.tribe && candidate.tribe && normalize(currentUser.tribe) === normalize(candidate.tribe);
    const sameCity = currentUser.city && candidate.city && normalize(currentUser.city) === normalize(candidate.city);
    const sameCountry =
      currentUser.country && candidate.country && normalize(currentUser.country) === normalize(candidate.country);
    const currentOrigin = currentUser.heritage || currentUser.countryOfOrigin;
    const candidateOrigin = (candidate as any).heritage || (candidate as any).countryOfOrigin;
    const sameOrigin =
      currentOrigin && candidateOrigin && normalize(currentOrigin) === normalize(candidateOrigin);

    if (sameTribe && sameCity) return 0;
    if (sameTribe && (sameCountry || sameOrigin)) return 1;
    if (sameCountry && sameCity) return 2;
    if (sameCountry || sameOrigin) return 3;
    return 4;
  };

  const sortByPriority = (list: MatchUser[]) =>
    list
      .map((item, index) => ({ item, index }))
      .sort((a, b) => {
        const aPriority = getPriority(a.item);
        const bPriority = getPriority(b.item);
        if (aPriority !== bPriority) return aPriority - bPriority;
        return a.index - b.index;
      })
      .map((entry) => entry.item);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, likes, sent, seen] = await Promise.all([
        fetchMatches(),
        fetchIncomingLikes(),
        fetchSentLikes(),
        fetchViews(),
      ]);
      setMatches(sortByPriority(m));
      setIncomingLikes(sortByPriority(likes));
      setSentLikes(sortByPriority(sent));
      setViews(sortByPriority(seen));
    } catch (err: any) {
      setError(err?.message || 'Could not load matches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openProfile = (item: MatchUser) => {
    const targetId = item.email || item.id;
    router.push({
      pathname: '/profile/[id]',
      params: {
        id: targetId,
        profile: JSON.stringify({
          ...item,
          photos: item.photo ? [item.photo] : [],
          compatibility: item.matchPercent ?? 90,
        }),
      },
    });
  };

  const openDirectChat = (item: MatchUser) => {
    const targetId = item.email || item.id;
    if (!targetId) return;
    router.push({
      pathname: '/(tabs)/chat/[id]',
      params: {
        id: targetId,
        name: item.name,
        avatar: item.photo || '',
      },
    });
  };

  const getMessageLabel = (item: MatchUser) =>
    item.gender === 'male' ? 'Chat him' : item.gender === 'female' ? 'Chat her' : 'Chat';

  const handleAccept = async (userId: string) => {
    setActioningId(userId);
    setError(null);
    try {
      await acceptLike(userId);
      const accepted = incomingLikes.find((p) => p.id === userId);
      setIncomingLikes((prev) => prev.filter((p) => p.id !== userId));
      if (accepted) {
        setMatches((prev) => {
          const exists = prev.some((m) => m.id === accepted.id);
          if (exists) return prev;
          return [{ ...accepted, status: 'Match' }, ...prev];
        });
        setTab('matches');
      } else {
        await loadData();
      }
    } catch (err: any) {
      setError(err?.message || 'Could not accept like');
    } finally {
      setActioningId(null);
    }
  };

  const handleDecline = async (userId: string) => {
    setActioningId(userId);
    setError(null);
    try {
      await declineLike(userId);
      setIncomingLikes((prev) => prev.filter((p) => p.id !== userId));
    } catch (err: any) {
      setError(err?.message || 'Could not decline like');
    } finally {
      setActioningId(null);
    }
  };

  const renderIncoming = ({ item }: { item: MatchUser }) => (
    <GlassCard style={styles.card} intensity={30} padding={spacing.md}>
      <View style={styles.row}>
        <Image source={{ uri: item.photo }} style={styles.avatar} />
        <View style={styles.meta}>
          <View style={styles.rowBetween}>
            <Text style={styles.name}>{item.name}{item.age ? `, ${item.age}` : ''}</Text>
            <View style={styles.statusPill}>
              <Ionicons name="heart" size={14} color={colors.primaryDark} />
              <Text style={styles.statusText}>{item.alreadyLiked ? 'Already liked' : 'New like'}</Text>
            </View>
          </View>
          <Text style={styles.subline}>{item.city || 'City'} • {item.tribe || 'Tribe'}</Text>
          <Text style={styles.vibe}>{item.bio || 'Interested in you'}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        {item.alreadyLiked ? (
          <>
            <TouchableOpacity style={[styles.actionButton, styles.secondary]} onPress={() => openProfile(item)}>
              <Ionicons name="person" size={18} color={colors.text.primary} />
              <Text style={styles.actionText}>View profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.primary]} onPress={() => openDirectChat(item)}>
              <Ionicons name="chatbubbles" size={18} color={colors.primaryDark} />
              <Text style={[styles.actionText, styles.primaryText]}>Chat</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondary]}
              onPress={() => handleDecline(item.id)}
              disabled={actioningId === item.id}
            >
              <Ionicons name="close" size={18} color={colors.text.primary} />
              <Text style={styles.actionText}>Pass</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.primary]}
              onPress={() => handleAccept(item.id)}
              disabled={actioningId === item.id}
            >
              <Ionicons name="checkmark" size={18} color={colors.primaryDark} />
              <Text style={[styles.actionText, styles.primaryText]}>Accept</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </GlassCard>
  );

  const renderGeneric = ({ item }: { item: MatchUser }) => (
    <GlassCard style={styles.card} intensity={30} padding={spacing.md}>
      <View style={styles.row}>
        <Image source={{ uri: item.photo }} style={styles.avatar} />
        <View style={styles.meta}>
          <View style={styles.rowBetween}>
            <Text style={styles.name}>{item.name}{item.age ? `, ${item.age}` : ''}</Text>
            <View style={styles.statusPill}>
              <Ionicons name="eye" size={14} color={colors.primaryDark} />
              <Text style={styles.statusText}>{item.status || (tab === 'views' ? 'Viewed you' : 'Sent like')}</Text>
            </View>
          </View>
          <Text style={styles.subline}>{item.city || 'City'} • {item.tribe || 'Tribe'}</Text>
          <Text style={styles.vibe}>{item.bio || 'Shared vibe detected'}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionButton, styles.secondary]} onPress={() => openProfile(item)}>
          <Ionicons name="person" size={18} color={colors.text.primary} />
          <Text style={styles.actionText}>View profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.primary]} onPress={() => openProfile(item)}>
          <Ionicons name="chatbubbles" size={18} color={colors.primaryDark} />
          <Text style={[styles.actionText, styles.primaryText]}>Chat</Text>
        </TouchableOpacity>
      </View>
    </GlassCard>
  );

  const renderSent = ({ item }: { item: MatchUser }) => (
    <GlassCard style={styles.card} intensity={30} padding={spacing.md}>
      <View style={styles.row}>
        <Image source={{ uri: item.photo }} style={styles.avatar} />
        <View style={styles.meta}>
          <View style={styles.rowBetween}>
            <Text style={styles.name}>{item.name}{item.age ? `, ${item.age}` : ''}</Text>
            <View style={styles.statusPill}>
              <Ionicons name="heart" size={14} color={colors.primaryDark} />
              <Text style={styles.statusText}>You liked</Text>
            </View>
          </View>
          <Text style={styles.subline}>{item.city || 'City'} • {item.tribe || 'Tribe'}</Text>
          <Text style={styles.vibe}>{item.bio || 'You liked this profile'}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primary, styles.fullWidthButton]}
          onPress={() => openDirectChat(item)}
        >
          <Ionicons name="chatbubbles" size={18} color={colors.primaryDark} />
          <Text style={[styles.actionText, styles.primaryText]}>{getMessageLabel(item)}</Text>
        </TouchableOpacity>
      </View>
    </GlassCard>
  );

  const listForTab = useMemo(() => {
    switch (tab) {
      case 'incoming':
        return incomingLikes;
      case 'sent':
        return sentLikes;
      case 'views':
        return views;
      case 'matches':
      default:
        return matches;
    }
  }, [tab, incomingLikes, sentLikes, views, matches]);

  const renderForTab = (item: MatchUser) => {
    if (tab === 'incoming') return renderIncoming({ item });
    if (tab === 'sent') return renderSent({ item });
    if (tab === 'matches') return (
      <MatchCard
        item={item}
        onViewProfile={() => openProfile(item)}
        onChat={() => openDirectChat(item)}
      />
    );
    return renderGeneric({ item });
  };

  const emptyCopy: Record<InboxTab, { title: string; subtitle: string; icon: string }> = {
    incoming: { 
      title: 'No new likes yet', 
      subtitle: 'Keep swiping to find your match!', 
      icon: 'heart-outline' 
    },
    sent: { 
      title: 'No sent likes yet', 
      subtitle: 'Start swiping to like profiles!', 
      icon: 'paper-plane-outline' 
    },
    views: { 
      title: 'No recent views', 
      subtitle: 'Your profile will get noticed soon!', 
      icon: 'eye-outline' 
    },
    matches: { 
      title: 'No matches yet', 
      subtitle: "The right connection is just around the corner!", 
      icon: 'sparkles-outline' 
    },
  };

  // Get new matches (last 24 hours or first 5)
  const newMatches = useMemo(() => {
    return matches.slice(0, 5);
  }, [matches]);

  if (loading) {
    return (
      <UniversalBackground scrollable contentContainerStyle={styles.scrollContent} title="Matches">
        <ActivityIndicator size="large" color={colors.secondary} />
        <Text style={styles.subtitle}>Loading your matches…</Text>
      </UniversalBackground>
    );
  }

  return (
    <UniversalBackground scrollable contentContainerStyle={styles.scrollContent} title="Matches">
      {error && <Text style={[styles.subtitle, { color: colors.error }]}>{error}</Text>}

      {/* New Matches Horizontal Section */}
      {newMatches.length > 0 && (
        <View style={styles.newMatchesSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="sparkles" size={18} color={colors.secondary} />
              <Text style={styles.sectionTitle}>New Matches</Text>
            </View>
            <Text style={styles.sectionCount}>{newMatches.length}</Text>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.newMatchesScroll}
          >
            {newMatches.map((match, index) => (
              <TouchableOpacity
                key={match.id || index}
                style={styles.newMatchItem}
                onPress={() => openDirectChat(match)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#D4AF37', '#B8860B']}
                  style={styles.newMatchBorder}
                >
                  <Image 
                    source={{ uri: match.photo }} 
                    style={styles.newMatchAvatar}
                  />
                </LinearGradient>
                <Text style={styles.newMatchName} numberOfLines={1}>
                  {match.name?.split(' ')[0]}
                </Text>
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.tabsRow}>
        {([
          { id: 'incoming', label: 'Who liked me', icon: 'heart' },
          { id: 'sent', label: 'Who I liked', icon: 'paper-plane' },
          { id: 'views', label: 'Who viewed me', icon: 'eye' },
          { id: 'matches', label: 'Matches', icon: 'sparkles' },
        ] as { id: InboxTab; label: string; icon: string }[]).map((t) => {
          const active = tab === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              style={[
                styles.tab,
                {
                  backgroundColor: tabPalette[t.id].bg,
                  borderColor: tabPalette[t.id].border,
                },
                active && {
                  backgroundColor: tabPalette[t.id].active,
                  borderColor: tabPalette[t.id].active,
                },
                active && styles.tabActive,
              ]}
              onPress={() => setTab(t.id)}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={t.icon as any} 
                size={14} 
                color={active ? tabPalette[t.id].textActive : tabPalette[t.id].text} 
              />
              <Text
                style={[
                  styles.tabText,
                  { color: tabPalette[t.id].text },
                  active && { color: tabPalette[t.id].textActive },
                  active && styles.tabTextActive,
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={listForTab}
        keyExtractor={(item, index) => `${tab}-${item.id || item.email || item.name || 'item'}-${index}`}
        renderItem={({ item }) => renderForTab(item)}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name={emptyCopy[tab].icon as any} size={48} color={colors.primaryLight} />
            </View>
            <Text style={styles.emptyTitle}>{emptyCopy[tab].title}</Text>
            <Text style={styles.emptySubtitle}>{emptyCopy[tab].subtitle}</Text>
            <TouchableOpacity 
              style={styles.discoverButton} 
              onPress={() => router.push('/(tabs)/discover')}
            >
              <Text style={styles.discoverButtonText}>Go to Discover</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
        }
      />
    </UniversalBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  // New Matches Section
  newMatchesSection: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '700',
  },
  sectionCount: {
    ...typography.body,
    color: colors.secondary,
    fontWeight: '700',
  },
  newMatchesScroll: {
    gap: spacing.md,
    paddingRight: spacing.lg,
  },
  newMatchItem: {
    alignItems: 'center',
    gap: spacing.xs,
    position: 'relative',
  },
  newMatchBorder: {
    padding: 3,
    borderRadius: 40,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 5,
  },
  newMatchAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.glass.dark,
  },
  newMatchName: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '600',
    maxWidth: 74,
    textAlign: 'center',
  },
  newBadge: {
    position: 'absolute',
    top: 0,
    right: -4,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  newBadgeText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '800',
    fontSize: 9,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.text.primary,
    fontWeight: '700',
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  discoverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  discoverButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: spacing.sm,
  },
  tabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.glass.light,
    minHeight: 40,
  },
  tabActive: {
    shadowColor: colors.glowGoldStrong,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  tabText: {
    ...typography.body,
    color: colors.text.secondary,
    fontWeight: '800',
  },
  tabTextActive: {
    textShadowColor: 'rgba(0,0,0,0.08)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  card: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  meta: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    ...typography.h3,
    color: colors.text.primary,
  },
  subline: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  vibe: {
    ...typography.body,
    color: colors.text.primary,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusText: {
    ...typography.small,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondary: {
    backgroundColor: colors.surface,
  },
  primary: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  actionText: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  primaryText: {
    color: colors.primaryDark,
  },
  fullWidthButton: {
    flex: 1,
  },
});
