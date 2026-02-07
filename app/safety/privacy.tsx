import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import UniversalBackground from '@/components/universal/UniversalBackground';
import { colors, spacing, typography, borderRadius, shadows } from '@/theme';

const PRIVACY_SECTIONS = [
  {
    title: 'Profile Visibility',
    icon: 'eye' as const,
    controls: [
      { key: 'showOnline', label: 'Show Online Status', description: 'Let others see when you are active', default: true },
      { key: 'showDistance', label: 'Show Distance', description: 'Display how far you are from other users', default: true },
      { key: 'showLastActive', label: 'Show Last Active', description: 'Display when you were last online', default: false },
    ],
  },
  {
    title: 'Discovery',
    icon: 'compass' as const,
    controls: [
      { key: 'showInDiscover', label: 'Show in Discover', description: 'Appear in other users\' discover feed', default: true },
      { key: 'showInTribe', label: 'Show in My Tribe', description: 'Appear in tribe member listings', default: true },
    ],
  },
  {
    title: 'Communication',
    icon: 'chatbubbles' as const,
    controls: [
      { key: 'messageAnyone', label: 'Messages from Anyone', description: 'Allow messages from non-matches', default: false },
      { key: 'readReceipts', label: 'Read Receipts', description: 'Let others know when you read their messages', default: true },
      { key: 'typingIndicator', label: 'Typing Indicator', description: 'Show when you are typing a message', default: true },
    ],
  },
  {
    title: 'Data & Analytics',
    icon: 'analytics' as const,
    controls: [
      { key: 'analytics', label: 'Usage Analytics', description: 'Help us improve by sharing anonymous usage data', default: true },
      { key: 'personalizedAds', label: 'Personalized Content', description: 'Receive tailored match recommendations', default: true },
    ],
  },
];

export default function PrivacyScreen() {
  const [settings, setSettings] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    PRIVACY_SECTIONS.forEach((section) => {
      section.controls.forEach((ctrl) => {
        initial[ctrl.key] = ctrl.default;
      });
    });
    return initial;
  });

  const toggleSetting = (key: string) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <UniversalBackground
      scrollable
      contentContainerStyle={styles.scrollContent}
      title="Privacy"
      showBottomNav
    >
      {/* Hero */}
      <LinearGradient
        colors={['#7C3AED', '#4C1D95']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroIconContainer}>
          <Ionicons name="lock-closed" size={36} color="#FFFFFF" />
        </View>
        <Text style={styles.heroTitle}>Your Privacy, Your Control</Text>
        <Text style={styles.heroSubtitle}>
          Manage exactly what others can see and how your data is used.
        </Text>
      </LinearGradient>

      {/* Privacy Sections */}
      {PRIVACY_SECTIONS.map((section) => (
        <View key={section.title} style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name={section.icon} size={18} color={colors.primaryLight} />
            </View>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>

          {section.controls.map((ctrl, index) => (
            <View key={ctrl.key}>
              {index > 0 && <View style={styles.divider} />}
              <View style={styles.controlRow}>
                <View style={styles.controlContent}>
                  <Text style={styles.controlLabel}>{ctrl.label}</Text>
                  <Text style={styles.controlDescription}>{ctrl.description}</Text>
                </View>
                <Switch
                  value={settings[ctrl.key]}
                  onValueChange={() => toggleSetting(ctrl.key)}
                  thumbColor={settings[ctrl.key] ? colors.primaryLight : '#ccc'}
                  trackColor={{
                    true: 'rgba(124, 58, 237, 0.3)',
                    false: 'rgba(255,255,255,0.1)',
                  }}
                />
              </View>
            </View>
          ))}
        </View>
      ))}

      {/* Data Rights */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <Ionicons name="document-text" size={18} color={colors.secondary} />
          </View>
          <Text style={styles.sectionTitle}>Your Data Rights</Text>
        </View>

        <TouchableOpacity style={styles.dataRow}>
          <Ionicons name="download" size={20} color={colors.primaryLight} />
          <View style={styles.dataContent}>
            <Text style={styles.dataLabel}>Download Your Data</Text>
            <Text style={styles.dataDescription}>Get a copy of all your personal data</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.text.secondary} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.dataRow}>
          <Ionicons name="trash" size={20} color={colors.error} />
          <View style={styles.dataContent}>
            <Text style={[styles.dataLabel, { color: colors.error }]}>Delete My Account</Text>
            <Text style={styles.dataDescription}>Permanently delete your account and data</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Legal Links */}
      <View style={styles.legalSection}>
        <TouchableOpacity style={styles.legalLink}>
          <Text style={styles.legalText}>Terms of Service</Text>
          <Ionicons name="open-outline" size={14} color={colors.text.secondary} />
        </TouchableOpacity>
        <Text style={styles.legalDot}>·</Text>
        <TouchableOpacity style={styles.legalLink}>
          <Text style={styles.legalText}>Privacy Policy</Text>
          <Ionicons name="open-outline" size={14} color={colors.text.secondary} />
        </TouchableOpacity>
        <Text style={styles.legalDot}>·</Text>
        <TouchableOpacity style={styles.legalLink}>
          <Text style={styles.legalText}>Cookie Policy</Text>
          <Ionicons name="open-outline" size={14} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>
    </UniversalBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  heroCard: { borderRadius: borderRadius.xl, padding: spacing.xl, alignItems: 'center', gap: spacing.md, ...shadows.md },
  heroIconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 20 },
  card: { backgroundColor: 'rgba(167, 139, 250, 0.06)', borderRadius: borderRadius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  sectionIconContainer: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(124, 58, 237, 0.12)', alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text.primary },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  controlRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs },
  controlContent: { flex: 1, gap: 2 },
  controlLabel: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  controlDescription: { fontSize: 12, color: colors.text.secondary, lineHeight: 16 },
  dataRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  dataContent: { flex: 1, gap: 2 },
  dataLabel: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  dataDescription: { fontSize: 12, color: colors.text.secondary, lineHeight: 16 },
  legalSection: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap', paddingVertical: spacing.md },
  legalLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legalText: { fontSize: 13, color: colors.text.secondary },
  legalDot: { color: colors.text.secondary, fontSize: 13 },
});
