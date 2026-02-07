import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Image, Modal, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, gradients, borderRadius } from '@/theme';
import { useAuthStore } from '@/store/authStore';

export interface UniversalHeaderProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  showNotificationBadge?: boolean;
  notificationCount?: number;
  onBackPress?: () => void;
  onSearchPress?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  onEditProfilePress?: () => void;
  onSettingsPress?: () => void;
  onGuaranteedDatingPress?: () => void;
  rightAction?: React.ReactNode;
}

const noop = () => undefined;

export default function UniversalHeader({
  title,
  subtitle,
  showBackButton = false,
  showNotificationBadge = true,
  notificationCount = 0,
  onSearchPress = noop,
  onBackPress = noop,
  onNotificationPress = noop,
  onProfilePress = noop,
  onEditProfilePress = noop,
  onSettingsPress = noop,
  onGuaranteedDatingPress = noop,
  rightAction,
}: UniversalHeaderProps) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const [showDropdown, setShowDropdown] = useState(false);

  const profileImageUrl =
    user?.photos?.[0] ||
    user?.profilePhotos?.[0] ||
    (user as any)?.profilePhoto ||
    (Array.isArray((user as any)?.photo) ? (user as any).photo[0] : undefined) ||
    (user as any)?.photo ||
    (user as any)?.profileImage ||
    (user as any)?.profileImageUrl ||
    (user as any)?.avatar ||
    (user as any)?.image ||
    (user as any)?.photoUrl;

  const handleProfileClick = () => {
    setShowDropdown(!showDropdown);
  };

  const handleMenuItemPress = (action: () => void) => {
    setShowDropdown(false);
    action();
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <LinearGradient
        colors={gradients.hero.colors}
        start={gradients.hero.start}
        end={gradients.hero.end}
        style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}
      >
        {showBackButton ? (
          <TouchableOpacity
            onPress={onBackPress || (() => router.back())}
            style={styles.iconButton}
            hitSlop={styles.hitSlop}
          >
            <Feather name="arrow-left" size={22} color={colors.text.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.whiteContainer}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../../assets/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <TouchableOpacity onPress={onSearchPress} style={styles.iconButton} hitSlop={styles.hitSlop}>
              <Feather name="search" size={26} color={colors.primaryDark} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onNotificationPress} style={styles.iconButton} hitSlop={styles.hitSlop}>
              <Feather name="bell" size={26} color={colors.primaryDark} />
              {showNotificationBadge && notificationCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{notificationCount > 9 ? '9+' : notificationCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.rightSection}>
          {rightAction ? (
            rightAction
          ) : (
            <>
              <TouchableOpacity onPress={handleProfileClick} style={styles.profileContainer} hitSlop={styles.hitSlop}>
                {profileImageUrl ? (
                  <Image source={{ uri: profileImageUrl }} style={styles.profileImage} />
                ) : (
                  <View style={styles.profileIconPlaceholder}>
                    <Feather name="user" size={18} color={colors.primaryDark} />
                  </View>
                )}
                <Text style={styles.profileLabel}>My Profile</Text>
              </TouchableOpacity>

              <Modal visible={showDropdown} transparent animationType="fade" onRequestClose={() => setShowDropdown(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setShowDropdown(false)}>
                  <View style={styles.dropdownContainer}>
                    <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuItemPress(onProfilePress)}>
                      <Feather name="user" size={20} color="#000000" />
                      <Text style={styles.menuItemText}>View Profile</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuItemPress(onEditProfilePress)}>
                      <Feather name="edit-2" size={20} color="#000000" />
                      <Text style={styles.menuItemText}>Edit Profile</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => handleMenuItemPress(() => router.push('/premium'))}
                    >
                      <Feather name="star" size={20} color="#000000" />
                      <Text style={styles.menuItemText}>Premium</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => handleMenuItemPress(onGuaranteedDatingPress)}
                    >
                      <Feather name="heart" size={20} color="#000000" />
                      <Text style={styles.menuItemText}>Guaranteed Dating</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => handleMenuItemPress(() => router.push('/referrals'))}
                    >
                      <Feather name="gift" size={20} color="#000000" />
                      <Text style={styles.menuItemText}>Referrals & Rewards</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => handleMenuItemPress(() => router.push('/safety'))}
                    >
                      <Feather name="shield" size={20} color="#000000" />
                      <Text style={styles.menuItemText}>Safety Center</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => handleMenuItemPress(() => router.push('/tips'))}
                    >
                      <Feather name="book" size={20} color="#000000" />
                      <Text style={styles.menuItemText}>Dating Tips</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuItemPress(onSettingsPress)}>
                      <Feather name="settings" size={20} color="#000000" />
                      <Text style={styles.menuItemText}>Settings</Text>
                    </TouchableOpacity>
                  </View>
                </Pressable>
              </Modal>
            </>
          )}
        </View>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  whiteContainer: {
    width: 310,
    height: 55,
    backgroundColor: colors.white,
    borderRadius: 34,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 10,
    marginLeft: -50,
  },
  rightSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
  },
  logoContainer: {
    width: 166,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 1,
  },
  logoImage: {
    width: 139,
    height: 45,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  iconButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginLeft: 10,
  },
  profileContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profileIconPlaceholder: {
    width: 62,
    height: 62,
    borderRadius: 66,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 3,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#DC2626',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
  hitSlop: {
    top: 10,
    bottom: 10,
    left: 10,
    right: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dropdownContainer: {
    position: 'absolute',
    top: 80,
    right: 16,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingVertical: 8,
    minWidth: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
});
