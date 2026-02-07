import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import UniversalBackground from '@/components/universal/UniversalBackground';
import GlassCard from '@/components/GlassCard';
import { colors, spacing, typography, borderRadius } from '@/theme';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    question: 'How do I get verified?',
    answer: 'You can verify your profile by uploading a government-issued ID and taking a selfie. Go to your Profile, tap "Edit profile", then select "Update location, interests, or preferences" to access the verification steps. Verification is optional but builds trust with potential matches.',
  },
  {
    question: 'Is my ID information safe?',
    answer: 'Yes, we take your privacy seriously. Your ID documents are encrypted and stored securely. We only use them to verify your identity and never share them with other users or third parties.',
  },
  {
    question: 'How does matching work?',
    answer: 'Our matching algorithm considers your preferences, location, tribe, faith, and interests to suggest compatible profiles. When two users both express interest in each other, it\'s a match! You can then start chatting.',
  },
  {
    question: 'What are Boosts?',
    answer: 'Boosts increase your profile visibility for a limited time, helping you get more views and potential matches. Premium members get free boosts monthly, or you can purchase them separately.',
  },
  {
    question: 'How do I cancel my subscription?',
    answer: 'You can manage your subscription through your device\'s app store (Google Play or App Store). Go to Settings > Account > Subscription to view your current plan and manage billing.',
  },
  {
    question: 'What is Incognito mode?',
    answer: 'Incognito mode lets you browse profiles without appearing in their viewers list. Only people you like will be able to see that you viewed their profile. This feature is available to Premium members.',
  },
  {
    question: 'How do I report inappropriate behavior?',
    answer: 'Tap the three dots menu on any profile or in a chat conversation and select "Report". You can also access the Safety Center from your Profile to report users or manage blocked accounts.',
  },
  {
    question: 'Can I change my location?',
    answer: 'Yes, you can update your location at any time. From your Profile, tap "Edit profile", then select "Update location, interests, or preferences" to modify your residence or travel settings.',
  },
  {
    question: 'What is the Concierge Service?',
    answer: 'Our Concierge Service provides personalized matchmaking assistance. A dedicated matchmaker reviews your profile and preferences to hand-pick compatible matches, making your journey to finding a partner more personalized.',
  },
  {
    question: 'How do I delete my account?',
    answer: 'To delete your account, go to Settings > Account > Delete Account. Please note this action is permanent and cannot be undone. All your matches, messages, and profile data will be removed.',
  },
];

export default function FAQScreen() {
  const [expanded, setExpanded] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    setExpanded(expanded === index ? null : index);
  };

  return (
    <UniversalBackground
      scrollable
      contentContainerStyle={styles.scrollContent}
      title="FAQ"
      showBottomNav
    >
      <Text style={styles.heading}>Frequently Asked Questions</Text>
      <Text style={styles.subheading}>Find answers to common questions about Tribalmingle</Text>

      {FAQ_DATA.map((item, index) => (
        <GlassCard key={index} style={styles.card} intensity={24} padding={0}>
          <TouchableOpacity
            style={styles.questionRow}
            onPress={() => toggleExpand(index)}
            activeOpacity={0.7}
          >
            <Text style={styles.question}>{item.question}</Text>
            <Ionicons
              name={expanded === index ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.text.secondary}
            />
          </TouchableOpacity>
          {expanded === index && (
            <View style={styles.answerContainer}>
              <Text style={styles.answer}>{item.answer}</Text>
            </View>
          )}
        </GlassCard>
      ))}

      <GlassCard style={styles.contactCard} intensity={28} padding={spacing.lg}>
        <View style={styles.contactHeader}>
          <Ionicons name="help-circle" size={24} color={colors.secondary} />
          <Text style={styles.contactTitle}>Still have questions?</Text>
        </View>
        <Text style={styles.contactText}>
          Our support team is here to help. Reach out to us and we'll get back to you as soon as possible.
        </Text>
        <Text style={styles.contactEmail}>support@tribalmingle.com</Text>
      </GlassCard>
    </UniversalBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  heading: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subheading: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  card: {
    overflow: 'hidden',
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    gap: spacing.md,
  },
  question: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  answerContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  answer: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  contactCard: {
    marginTop: spacing.lg,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  contactTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  contactText: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  contactEmail: {
    ...typography.body,
    color: colors.secondary,
    fontWeight: '600',
  },
});
