import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, RefreshControl, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import UniversalBackground from '@/components/universal/UniversalBackground';
import GlassCard from '@/components/GlassCard';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { fetchThreads, Thread } from '@/api/messaging';
import { useNotificationStore } from '@/store/notificationStore';

const isExpoGo =
  Constants.appOwnership === 'expo' ||
  (Constants as any).executionEnvironment === 'storeClient';

const ConversationRow = ({ thread, onPress }: { thread: Thread; onPress: () => void }) => {
  const participant = thread.participants?.[0];
  const name = participant?.name || 'Conversation';
  const photo = participant?.photo;
  const lastMessage = thread.lastMessage?.content || 'Say hello';
  const timeLabel = (() => {
    if (!thread.lastMessage?.createdAt) return '';
    const diffMs = Date.now() - new Date(thread.lastMessage.createdAt).getTime();
    const diffMinutes = Math.max(0, Math.round(diffMs / (60 * 1000)));
    if (diffMinutes < 1) return 'now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays}d ago`;
  })();

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <GlassCard style={styles.card} intensity={25} padding={spacing.md}>
        <View style={styles.row}>
          {photo ? <Image source={{ uri: photo }} style={styles.avatar} /> : <View style={[styles.avatar, styles.avatarPlaceholder]} />}
          <View style={styles.meta}>
            <View style={styles.rowBetween}>
              <Text style={styles.name}>{name}</Text>
              <Text style={styles.time}>{timeLabel}</Text>
            </View>
            <Text style={styles.message} numberOfLines={1}>{lastMessage}</Text>
          </View>
          {(thread.unreadCount ?? 0) > 0 ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{thread.unreadCount}</Text>
            </View>
          ) : null}
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
};

export default function ChatScreen() {
  const router = useRouter();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; tone?: 'info' | 'success' | 'error' } | null>(null);
  const addNotification = useNotificationStore((s) => s.addNotification);

  const loadThreads = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchThreads();
      setThreads(data);
    } catch (err: any) {
      setError(err?.message || 'Could not load conversations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadThreads();
    const interval = setInterval(loadThreads, 5000);
    let sub: { remove: () => void } | null = null;

    const registerNotificationListener = async () => {
      if (isExpoGo) return;
      const Notifications = await import('expo-notifications');
      sub = Notifications.addNotificationReceivedListener((notification) => {
        const type = (notification?.request?.content?.data as any)?.type;
        if (type === 'message') {
          loadThreads();
          setToast({ message: 'New message', tone: 'info' });
          const title = notification?.request?.content?.title || 'New message';
          const body = notification?.request?.content?.body || undefined;
          addNotification({ title, body, data: notification?.request?.content?.data as any });
        }
      });
    };

    registerNotificationListener();
    return () => {
      clearInterval(interval);
      sub?.remove();
    };
  }, [loadThreads]);

  const onRefresh = () => {
    setRefreshing(true);
    loadThreads();
  };

  useEffect(() => {
    if (!error) return;
    setToast({ message: error, tone: 'error' });
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [error]);

  const sortedThreads = useMemo(
    () =>
      [...threads].sort((a, b) => {
        const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return bTime - aTime;
      }),
    [threads]
  );

  const renderItem = ({ item }: { item: Thread }) => (
    <ConversationRow
      thread={item}
      onPress={() =>
        router.push({
          pathname: '/(tabs)/chat/[id]',
          params: {
            id: item.id,
            name: item.participants?.[0]?.name || 'Chat',
            avatar: item.participants?.[0]?.photo || '',
          },
        })
      }
    />
  );

  if (loading) {
    return (
      <UniversalBackground scrollable contentContainerStyle={styles.scrollContent} title="Chats">
        <ActivityIndicator size="large" color={colors.secondary} />
        <Text style={styles.subtitle}>Loading conversations…</Text>
      </UniversalBackground>
    );
  }

  return (
    <UniversalBackground
      scrollable
      contentContainerStyle={styles.scrollContent}
      title="Chats"
      toast={toast}
    >
      <View style={styles.headerRow}>
        <Text style={styles.subtitle}>Recent conversations</Text>
        <TouchableOpacity style={styles.filterPill} onPress={onRefresh}>
          <Ionicons name="reload" size={16} color={colors.primaryDark} />
          <Text style={styles.filterText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={[styles.subtitle, { color: colors.error }]}>{error}</Text> : null}

      <FlatList
        data={sortedThreads}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.subtitle}>No conversations yet. Start swiping to match and chat.</Text>}
        scrollEnabled={false}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  filterText: {
    ...typography.small,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  list: {
    gap: spacing.sm,
  },
  card: {
    borderRadius: borderRadius.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glass.dark,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    ...typography.h3,
    color: colors.text.primary,
  },
  time: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  message: {
    ...typography.body,
    color: colors.text.secondary,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unreadBadge: {
    minWidth: 28,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.full,
    alignItems: 'center',
  },
  unreadText: {
    ...typography.small,
    color: colors.primaryDark,
    fontWeight: '700',
  },
});
