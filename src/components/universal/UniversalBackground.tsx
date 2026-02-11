import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle, ScrollViewProps, TouchableOpacity, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { router, useNavigation } from 'expo-router';
import { colors, gradients, spacing, typography, borderRadius } from '@/theme';
import UniversalHeader, { UniversalHeaderProps } from './UniversalHeader';
import UniversalBottomNav from './UniversalBottomNav';

interface UniversalBackgroundProps extends Partial<UniversalHeaderProps> {
  children: React.ReactNode;
  scrollable?: boolean;
  useGradient?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
  showBottomNav?: boolean;
  /** Control which safe area edges are applied. Default: all edges. Use ['top'] for keyboard screens. */
  safeAreaEdges?: Edge[];
  toast?: { message: string; tone?: 'error' | 'info' | 'success' } | null;
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
  onSearchPress,
  onNotificationPress,
  onProfilePress,
  onEditProfilePress,
  onSettingsPress,
  onGuaranteedDatingPress,
  rightAction,
  showBottomNav = false,
  safeAreaEdges,
  toast,
}: UniversalBackgroundProps) {
  const Container = scrollable ? ScrollView : View;
  const navigation = useNavigation<any>();
  const canGoBack = typeof navigation?.canGoBack === 'function' ? navigation.canGoBack() : false;
  const resolvedShowBackButton = showBackButton ?? canGoBack;
  const resolvedOnBackPress =
    onBackPress ||
    (() => {
      if (canGoBack && typeof navigation?.goBack === 'function') {
        navigation.goBack();
        return;
      }
      router.replace('/(tabs)/home');
    });

  // Default handlers for profile dropdown actions
  const resolvedOnProfilePress = onProfilePress || (() => router.push('/(tabs)/profile'));
  const resolvedOnEditProfilePress = onEditProfilePress || (() => router.push('/setup'));
  const resolvedOnSettingsPress = onSettingsPress || (() => router.push('/settings'));
  const resolvedOnGuaranteedDatingPress = onGuaranteedDatingPress || (() => router.push('/guaranteed-dating'));
  const resolvedOnSearchPress = onSearchPress || (() => router.push('/search'));
  const resolvedOnNotificationPress = onNotificationPress || (() => router.push('/notifications'));

  const showPageHeader = resolvedShowBackButton || Boolean(title);
  const toastTone = toast?.tone ?? 'info';

  const content = (
    <SafeAreaView style={styles.safeArea} edges={safeAreaEdges}>
      <UniversalHeader
        title={undefined}
        subtitle={undefined}
        showBackButton={false}
        showNotificationBadge={showNotificationBadge}
        notificationCount={notificationCount}
        onBackPress={resolvedOnBackPress}
        onSearchPress={resolvedOnSearchPress}
        onNotificationPress={resolvedOnNotificationPress}
        onProfilePress={resolvedOnProfilePress}
        onEditProfilePress={resolvedOnEditProfilePress}
        onSettingsPress={resolvedOnSettingsPress}
        onGuaranteedDatingPress={resolvedOnGuaranteedDatingPress}
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
        {toast?.message ? (
          <View
            style={[
              styles.toast,
              toastTone === 'error' && styles.toastError,
              toastTone === 'success' && styles.toastSuccess,
            ]}
          >
            <Text style={styles.toastText}>{toast.message}</Text>
          </View>
        ) : null}
        <Container
          style={[styles.container, style]}
          contentContainerStyle={scrollable ? [styles.scrollContent, contentContainerStyle] : undefined}
          showsVerticalScrollIndicator={false}
        >
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
  toast: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.glass.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toastError: {
    backgroundColor: 'rgba(248, 113, 113, 0.2)',
    borderColor: 'rgba(248, 113, 113, 0.35)',
  },
  toastSuccess: {
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  toastText: {
    ...typography.body,
    color: colors.text.primary,
  },
});
