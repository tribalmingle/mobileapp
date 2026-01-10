import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle, ScrollViewProps, TouchableOpacity, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, gradients, spacing, typography, borderRadius } from '@/theme';
import UniversalHeader, { UniversalHeaderProps } from './UniversalHeader';
import UniversalBottomNav from './UniversalBottomNav';
import { useNotificationStore } from '@/store/notificationStore';

interface UniversalBackgroundProps extends Partial<UniversalHeaderProps> {
  children: React.ReactNode;
  scrollable?: boolean;
  useGradient?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
  showBottomNav?: boolean;
  toast?: { message: string; tone?: 'info' | 'success' | 'error' } | null;
}

export default function UniversalBackground({
  children,
  scrollable = false,
  useGradient = true,
  style,
  contentContainerStyle,
  title,
  subtitle,
  showBackButton,
  showNotificationBadge,
  notificationCount,
  onBackPress,
  onSearchPress = () => router.push('/search'),
  onNotificationPress,
  onProfilePress,
  onEditProfilePress,
  onSettingsPress,
  onGuaranteedDatingPress,
  rightAction,
  showBottomNav = false,
  toast,
}: UniversalBackgroundProps) {
  const Container = scrollable ? ScrollView : View;
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const resolvedShowBackButton = showBackButton ?? false;
  const resolvedOnBackPress =
    onBackPress ||
    (() => {
      if (typeof router?.canGoBack === 'function' && router.canGoBack()) {
        router.back();
        return;
      }
      router.replace('/(tabs)/home');
    });

  const showPageHeader = resolvedShowBackButton || Boolean(title);

  const content = (
    <SafeAreaView style={styles.safeArea}>
      <UniversalHeader
        title={undefined}
        subtitle={undefined}
        showBackButton={false}
        showNotificationBadge={showNotificationBadge}
        notificationCount={notificationCount ?? unreadCount}
        onBackPress={resolvedOnBackPress}
        onSearchPress={onSearchPress}
        onNotificationPress={onNotificationPress || (() => router.push('/notifications'))}
        onProfilePress={onProfilePress}
        onEditProfilePress={onEditProfilePress}
        onSettingsPress={onSettingsPress}
        onGuaranteedDatingPress={onGuaranteedDatingPress}
        rightAction={rightAction}
      />
      <View style={styles.contentWithNav}>
        {showPageHeader && (
          <View style={styles.pageHeader}>
            {resolvedShowBackButton && (
              <TouchableOpacity
                onPress={resolvedOnBackPress}
                style={styles.backButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.backIcon}>←</Text>
              </TouchableOpacity>
            )}
            {title ? <Text style={styles.pageTitle}>{title}</Text> : null}
          </View>
        )}
        <Container
          style={[styles.container, style]}
          contentContainerStyle={scrollable ? [styles.scrollContent, contentContainerStyle] : undefined}
          showsVerticalScrollIndicator={false}
        >
          {toast?.message ? (
            <View
              style={[
                styles.toast,
                toast.tone === 'success' && styles.toastSuccess,
                toast.tone === 'error' && styles.toastError,
              ]}
            >
              <Text style={styles.toastText}>{toast.message}</Text>
            </View>
          ) : null}
          {children}
        </Container>
        {showBottomNav && <UniversalBottomNav />}
      </View>
    </SafeAreaView>
  );

  if (!useGradient) {
    return <View style={styles.solidBackground}>{content}</View>;
  }

  return (
    <LinearGradient
      colors={gradients.hero.colors}
      start={gradients.hero.start}
      end={gradients.hero.end}
      style={styles.gradient}
    >
      {content}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  solidBackground: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  contentWithNav: {
    flex: 1,
    paddingTop: 100,
  },
  container: {
    flex: 1,
    paddingTop: spacing.md - 10,
    paddingHorizontal: -5,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: spacing.md - 10,
    paddingBottom: 70,
    paddingHorizontal: -5,
  },
  toast: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.glass.dark,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  toastSuccess: {
    borderColor: colors.success,
  },
  toastError: {
    borderColor: colors.error,
  },
  toastText: {
    ...typography.body,
    color: colors.text.primary,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xs - 10,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md - 10,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  backIcon: {
    ...typography.h3,
    color: colors.primaryDark,
    marginTop: -2,
  },
  pageTitle: {
    ...typography.h2,
    color: colors.text.primary,
  },
});
