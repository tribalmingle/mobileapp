import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, RefreshControl, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import UniversalBackground from '@/components/universal/UniversalBackground';
import GlassCard from '@/components/GlassCard';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { fetchThreads, Thread, markThreadRead } from '@/api/messaging';
import { useChatStore } from '@/store/chatStore';
import { onPushEvent } from '@/lib/notificationBus';

const ConversationRow = ({ thread, onPress, onMarkRead }: { thread: Thread; onPress: () => void; onMarkRead: () => void }) => {
  const participant = thread.participants?.[0];
  const name = participant?.name || 'Conversation';
  const photo = participant?.photo;
  // Show actual last message content; only fall back to "Say hello" when there's no lastMessage at all
  const lastMessage = thread.lastMessage
    ? (thread.lastMessage.content || 'Sent a message')
    : 'Say hello 👋';
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

  // Use chatStore's threadCounts for accurate unread state (respects locally-read threads)
  const storeUnread = useChatStore((s) => s.threadCounts[thread.id] ?? thread.unreadCount ?? 0);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      onLongPress={() => {
        if (storeUnread > 0) {
          Alert.alert('Mark as Read', 'Mark this conversation as read?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Mark Read', onPress: onMarkRead },
          ]);
        }
      }}
    >
      <GlassCard style={styles.card} intensity={25} padding={spacing.md}>
        <View style={styles.row}>
          {photo ? <Image source={{ uri: photo }} style={styles.avatar} /> : <View style={[styles.avatar, styles.avatarPlaceholder]} />}
          <View style={styles.meta}>
            <View style={styles.rowBetween}>
              <Text style={styles.name}>{name}</Text>
              <Text style={styles.time}>{timeLabel}</Text>
            </View>
            <View style={styles.messageRow}>
              <Text style={[styles.message, storeUnread > 0 && styles.messageUnread]} numberOfLines={1}>{lastMessage}</Text>
              {/* Read receipt indicator for last sent message */}
              {thread.lastMessage?.status === 'read' && (
                <Ionicons name="checkmark-done" size={14} color={colors.secondary} style={{ marginLeft: 4 }} />
              )}
            </View>
          </View>
          {storeUnread > 0 ? (
            <TouchableOpacity onPress={onMarkRead} activeOpacity={0.7} style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{storeUnread}</Text>
            </TouchableOpacity>
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
  const syncFromThreads = useChatStore((s) => s.syncFromThreads);
  const markThreadReadInStore = useChatStore((s) => s.markThreadRead);

  const handleMarkRead = useCallback((threadId: string) => {
    markThreadRead(threadId).catch(() => {});
    markThreadReadInStore(threadId);
  }, [markThreadReadInStore]);

  const loadThreads = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchThreads();
      setThreads(data);
      // Sync thread unread counts with the store, respecting locally-read threads
      syncFromThreads(data.map((t) => ({ id: t.id, unreadCount: t.unreadCount || 0 })));
    } catch (err: any) {
      setError(err?.message || 'Could not load conversations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [syncFromThreads]);

  useEffect(() => {
    loadThreads();
    const interval = setInterval(loadThreads, 5000);
    const unsubscribe = onPushEvent((payload) => {
      if (payload?.type === 'message') {
        loadThreads();
        setToast({ message: 'New message', tone: 'info' });
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
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
      onMarkRead={() => handleMarkRead(item.id)}
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
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
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
    flex: 1,
  },
  messageUnread: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  messageRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
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
