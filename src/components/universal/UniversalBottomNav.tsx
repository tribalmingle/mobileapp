import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { colors, gradients, spacing } from '@/theme';
import { useNotificationStore } from '@/store/notificationStore';
import { useChatStore } from '@/store/chatStore';

interface NavItemConfig {
  id: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  href: string;
  match: string[];
}

const NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'home',
    label: 'Home',
    icon: 'home',
    href: '/(tabs)/home',
    match: ['/(tabs)/home', '/home'],
  },
  {
    id: 'discover',
    label: 'Discover',
    icon: 'compass',
    href: '/(tabs)/discover',
    match: ['/(tabs)/discover', '/discover'],
  },
  {
    id: 'matches',
    label: 'Matches',
    icon: 'heart',
    href: '/(tabs)/matches',
    match: ['/(tabs)/matches', '/matches'],
  },
  {
    id: 'chat',
    label: 'Chat',
    icon: 'message-circle',
    href: '/(tabs)/chat',
    match: ['/(tabs)/chat', '/chat'],
  },
  {
    id: 'my-tribe',
    label: 'My Tribe',
    icon: 'users',
    href: '/my-tribe',
    match: ['/my-tribe'],
  },
];

export default function UniversalBottomNav({ totalUnreadCount = 0 }: { totalUnreadCount?: number }) {
  const pathname = usePathname() ?? '';
  const insets = useSafeAreaInsets();
  const notificationUnread = useNotificationStore((s) => s.unreadCount);
  const chatUnread = useChatStore((s) => s.unreadCount);
  
  // Use chat-specific unread count for the chat tab badge
  const chatBadgeCount = totalUnreadCount + chatUnread;

  // Hide the bottom nav when inside a chat conversation (chat/[id])
  const isChatDetail = /^\/(tabs\/)?chat\/[^/]+/.test(pathname) && pathname !== '/(tabs)/chat' && pathname !== '/chat';
  if (isChatDetail) return null;

  const handleNavigate = (href: string) => {
    router.replace(href);
  };

  return (
    <LinearGradient
      colors={gradients.hero.colors.slice().reverse()}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[
        styles.container,
        {
          paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 8) : spacing.sm,
        },
      ]}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = item.match.some((segment) => pathname.startsWith(segment));
        const color = isActive ? colors.secondary : colors.text.secondary;
        const showBadge = item.id === 'chat' && chatBadgeCount > 0;

        return (
          <TouchableOpacity
            key={item.id}
            style={styles.navItem}
            onPress={() => handleNavigate(item.href)}
            activeOpacity={0.8}
          >
            <View style={styles.iconWrapper}>
              {isActive && <View style={styles.activeIndicator} />}
              <Feather name={item.icon} size={22} color={color} />
              {showBadge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{chatBadgeCount > 99 ? '99+' : chatBadgeCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: colors.glowGoldStrong,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  iconWrapper: {
    width: 44,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  label: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 4,
    fontWeight: '500',
  },
  labelActive: {
    color: colors.secondary,
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.secondary,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.background,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
  },
});
