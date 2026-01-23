import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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

const MatchCard = ({ item, onOpen }: { item: MatchUser; onOpen: () => void }) => (
  <TouchableOpacity activeOpacity={0.9} onPress={onOpen}>
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
        <TouchableOpacity style={[styles.actionButton, styles.secondary]} onPress={onOpen}>
          <Ionicons name="chatbubbles" size={18} color={colors.text.primary} />
          <Text style={styles.actionText}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.primary]} onPress={onOpen}>
          <Ionicons name="videocam" size={18} color={colors.primaryDark} />
          <Text style={[styles.actionText, styles.primaryText]}>Video intro</Text>
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
    router.push({
      pathname: '/profile/[id]',
      params: {
        id: item.id,
        profile: JSON.stringify({
          ...item,
          photos: item.photo ? [item.photo] : [],
          compatibility: 90,
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
      setIncomingLikes((prev) => prev.filter((p) => p.id !== userId));
      await loadData();
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
              <Text style={styles.statusText}>New like</Text>
            </View>
          </View>
          <Text style={styles.subline}>{item.city || 'City'} • {item.tribe || 'Tribe'}</Text>
          <Text style={styles.vibe}>{item.bio || 'Interested in you'}</Text>
        </View>
      </View>
      <View style={styles.actions}>
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
    if (tab === 'matches') return <MatchCard item={item} onOpen={() => openProfile(item)} />;
    return renderGeneric({ item });
  };

  const emptyCopy: Record<InboxTab, string> = {
    incoming: 'No new likes yet. Keep swiping!',
    sent: 'No sent likes yet.',
    views: 'No recent views.',
    matches: 'No matches yet. Keep swiping!',
  };

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

      <View style={styles.tabsRow}>
        {([
          { id: 'incoming', label: 'Who liked me' },
          { id: 'sent', label: 'Who I liked' },
          { id: 'views', label: 'Who viewed me' },
          { id: 'matches', label: 'Matches' },
        ] as { id: InboxTab; label: string }[]).map((t) => {
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
        ListEmptyComponent={<Text style={styles.subtitle}>{emptyCopy[tab]}</Text>}
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
    paddingHorizontal: spacing.lg * 1.1,
    paddingVertical: spacing.sm * 1.1,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.glass.light,
    minHeight: 46,
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
