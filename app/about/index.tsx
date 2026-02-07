import React from 'react';
import { View, Text, StyleSheet, Image, Linking, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import UniversalBackground from '@/components/universal/UniversalBackground';
import GlassCard from '@/components/GlassCard';
import { colors, spacing, typography, borderRadius } from '@/theme';
import Constants from 'expo-constants';

const APP_VERSION = Constants.expoConfig?.version || '1.0.0';

const SOCIAL_LINKS = [
  { icon: 'logo-instagram', label: 'Instagram', url: 'https://instagram.com/tribalmingle' },
  { icon: 'logo-twitter', label: 'Twitter/X', url: 'https://twitter.com/tribalmingle' },
  { icon: 'logo-facebook', label: 'Facebook', url: 'https://facebook.com/tribalmingle' },
  { icon: 'logo-tiktok', label: 'TikTok', url: 'https://tiktok.com/@tribalmingle' },
];

export default function AboutScreen() {
  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <UniversalBackground
      scrollable
      contentContainerStyle={styles.scrollContent}
      title="About Us"
      showBottomNav
    >
      {/* Hero Section */}
      <GlassCard style={styles.heroCard} intensity={28} padding={spacing.xl}>
        <View style={styles.logoContainer}>
          <Ionicons name="heart" size={48} color={colors.secondary} />
        </View>
        <Text style={styles.appName}>Tribalmingle</Text>
        <Text style={styles.tagline}>Where Heritage Meets Love</Text>
        <Text style={styles.version}>Version {APP_VERSION}</Text>
      </GlassCard>

      {/* Mission Section */}
      <GlassCard style={styles.card} intensity={24} padding={spacing.lg}>
        <Text style={styles.sectionTitle}>Our Mission</Text>
        <Text style={styles.bodyText}>
          Tribalmingle is a modern dating platform designed specifically for Africans and people of African descent 
          who value their cultural heritage and faith. We believe that finding a meaningful connection is about more 
          than just swiping – it's about finding someone who shares your values, understands your traditions, and 
          respects your roots.
        </Text>
      </GlassCard>

      {/* Values Section */}
      <GlassCard style={styles.card} intensity={24} padding={spacing.lg}>
        <Text style={styles.sectionTitle}>Our Values</Text>
        
        <View style={styles.valueItem}>
          <View style={styles.valueIcon}>
            <Ionicons name="shield-checkmark" size={20} color={colors.secondary} />
          </View>
          <View style={styles.valueContent}>
            <Text style={styles.valueTitle}>Trust & Safety</Text>
            <Text style={styles.valueText}>
              We prioritize your safety with robust verification systems and moderation.
            </Text>
          </View>
        </View>

        <View style={styles.valueItem}>
          <View style={styles.valueIcon}>
            <Ionicons name="people" size={20} color={colors.secondary} />
          </View>
          <View style={styles.valueContent}>
            <Text style={styles.valueTitle}>Community</Text>
            <Text style={styles.valueText}>
              We celebrate the rich diversity of African cultures and tribes.
            </Text>
          </View>
        </View>

        <View style={styles.valueItem}>
          <View style={styles.valueIcon}>
            <Ionicons name="heart" size={20} color={colors.secondary} />
          </View>
          <View style={styles.valueContent}>
            <Text style={styles.valueTitle}>Authenticity</Text>
            <Text style={styles.valueText}>
              We encourage genuine connections built on shared values and honesty.
            </Text>
          </View>
        </View>

        <View style={styles.valueItem}>
          <View style={styles.valueIcon}>
            <Ionicons name="ribbon" size={20} color={colors.secondary} />
          </View>
          <View style={styles.valueContent}>
            <Text style={styles.valueTitle}>Quality</Text>
            <Text style={styles.valueText}>
              We focus on meaningful matches over quantity, valuing depth of connection.
            </Text>
          </View>
        </View>
      </GlassCard>

      {/* Connect Section */}
      <GlassCard style={styles.card} intensity={24} padding={spacing.lg}>
        <Text style={styles.sectionTitle}>Connect With Us</Text>
        <View style={styles.socialRow}>
          {SOCIAL_LINKS.map((link) => (
            <TouchableOpacity
              key={link.label}
              style={styles.socialButton}
              onPress={() => openLink(link.url)}
              activeOpacity={0.7}
            >
              <Ionicons name={link.icon as any} size={24} color={colors.text.primary} />
              <Text style={styles.socialLabel}>{link.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </GlassCard>

      {/* Contact Section */}
      <GlassCard style={styles.card} intensity={24} padding={spacing.lg}>
        <Text style={styles.sectionTitle}>Contact</Text>
        
        <TouchableOpacity style={styles.contactRow} onPress={() => openLink('mailto:support@tribalmingle.com')}>
          <Ionicons name="mail" size={18} color={colors.secondary} />
          <Text style={styles.contactText}>support@tribalmingle.com</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactRow} onPress={() => openLink('https://tribalmingle.com')}>
          <Ionicons name="globe" size={18} color={colors.secondary} />
          <Text style={styles.contactText}>www.tribalmingle.com</Text>
        </TouchableOpacity>
      </GlassCard>

      {/* Legal Section */}
      <View style={styles.legalRow}>
        <TouchableOpacity onPress={() => openLink('https://tribalmingle.com/privacy')}>
          <Text style={styles.legalLink}>Privacy Policy</Text>
        </TouchableOpacity>
        <Text style={styles.legalDivider}>•</Text>
        <TouchableOpacity onPress={() => openLink('https://tribalmingle.com/terms')}>
          <Text style={styles.legalLink}>Terms of Service</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.copyright}>© {new Date().getFullYear()} Tribalmingle. All rights reserved.</Text>
    </UniversalBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  heroCard: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 107, 157, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  appName: {
    ...typography.h1,
    color: colors.text.primary,
  },
  tagline: {
    ...typography.body,
    color: colors.secondary,
    fontWeight: '600',
  },
  version: {
    ...typography.small,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  card: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  bodyText: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  valueItem: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  valueIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 107, 157, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueContent: {
    flex: 1,
    gap: spacing.xs,
  },
  valueTitle: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  valueText: {
    ...typography.small,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  socialRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  socialLabel: {
    ...typography.small,
    color: colors.text.primary,
    fontWeight: '500',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  contactText: {
    ...typography.body,
    color: colors.text.primary,
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  legalLink: {
    ...typography.small,
    color: colors.secondary,
  },
  legalDivider: {
    ...typography.small,
    color: colors.text.secondary,
  },
  copyright: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
