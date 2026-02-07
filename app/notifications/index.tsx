import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import UniversalBackground from '@/components/universal/UniversalBackground';
import GlassCard from '@/components/GlassCard';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useNotificationStore } from '@/store/notificationStore';
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from '@/api/notifications';

export default function NotificationsScreen() {
  // Select primitives / stable references individually to avoid new-object-per-render
  const items = useNotificationStore((s) => s.items);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const setNotifications = useNotificationStore((s) => s.setNotifications);
  const storeMarkAllRead = useNotificationStore((s) => s.markAllRead);
  const storeMarkRead = useNotificationStore((s) => s.markRead);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchNotifications();
        if (isMounted) setNotifications(data as any);
      } catch {
        // ignore; UI will show empty state
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []); // run once on mount – setNotifications is a stable Zustand action

  const handleMarkAll = useCallback(async () => {
    try {
      storeMarkAllRead();
      await markAllNotificationsRead();
    } catch {
      // swallow errors; keep UI responsive
    }
  }, [storeMarkAllRead]);

  const handlePress = useCallback(async (id: string, read: boolean) => {
    if (!read) {
      storeMarkRead(id);
      try {
        await markNotificationRead(id);
      } catch {
        // ignore; store already updated
      }
    }
  }, [storeMarkRead]);

  return (
    <UniversalBackground scrollable title="Notifications" showBackButton>
      <View style={styles.headerRow}>
        <Text style={styles.subtitle}>{unreadCount > 0 ? `${unreadCount} new` : 'All caught up'}</Text>
        {items.length > 0 ? (
          <TouchableOpacity onPress={handleMarkAll} style={styles.clearPill}>
            <Text style={styles.clearText}>Mark all read</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.secondary} style={{ marginTop: spacing.lg }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, index) => item.id || item.createdAt || `${index}`}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.9} onPress={() => handlePress(item.id, item.read)}>
              <GlassCard style={styles.card} intensity={25} padding={spacing.md}>
                <View style={styles.cardHeader}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={[styles.time, !item.read && styles.unreadDot]}>
                    {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''}
                  </Text>
                </View>
                {item.body ? <Text style={styles.body}>{item.body}</Text> : null}
              </GlassCard>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.subtitle}>No notifications yet.</Text>}
          scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: spacing.xxl, gap: spacing.sm }}
        />
      )}
    </UniversalBackground>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  clearPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.full,
  },
  clearText: {
    ...typography.small,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  card: {
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
  },
  body: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  time: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  unreadDot: {
    color: colors.primary,
    fontWeight: '700',
  },
});
