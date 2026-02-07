import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import UniversalBackground from '@/components/universal/UniversalBackground';
import GlassCard from '@/components/GlassCard';
import GoldButton from '@/components/universal/GoldButton';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useSubscriptionStore } from '@/store/subscriptionStore';

// App Store Product IDs
const SUBSCRIPTION_PRODUCTS = {
  monthly: 'com.tribalmingle.com.monthly',
  quarterly: 'com.tribalmingle.com.quarterly',
  biannual: 'com.familyforge.forge.biannual',
  yearly: 'com.tribalmingle.com.yearly',
} as const;

// One-time purchase product IDs
const ONETIME_PRODUCTS = {
  guaranteedDating: 'com.tribalmingle.com.concierge',
} as const;

const SUBSCRIPTION_PLANS = [
  {
    id: 'monthly',
    productId: SUBSCRIPTION_PRODUCTS.monthly,
    name: 'Monthly',
    price: '£15',
    period: 'per month',
    perDay: '£0.50/day',
    popular: false,
  },
  {
    id: 'quarterly',
    productId: SUBSCRIPTION_PRODUCTS.quarterly,
    name: '3 Months',
    price: '£35',
    period: 'for 3 months',
    perDay: '£0.39/day',
    popular: true,
    savings: 'Save 22%',
  },
  {
    id: 'biannual',
    productId: SUBSCRIPTION_PRODUCTS.biannual,
    name: '6 Months',
    price: '£60',
    period: 'for 6 months',
    perDay: '£0.33/day',
    popular: false,
    savings: 'Save 33%',
  },
  {
    id: 'yearly',
    productId: SUBSCRIPTION_PRODUCTS.yearly,
    name: '12 Months',
    price: '£100',
    period: 'per year',
    perDay: '£0.27/day',
    popular: false,
    savings: 'Save 44%',
  },
];

const premiumFeatures = [
  { icon: 'heart', text: 'Unlimited swipes' },
  { icon: 'chatbubbles', text: 'Unlimited messaging' },
  { icon: 'eye', text: 'See who liked you' },
  { icon: 'person', text: 'See who viewed you' },
  { icon: 'search', text: 'Advanced filters' },
  { icon: 'people', text: 'Community access' },
  { icon: 'shield-checkmark', text: 'Verified profiles' },
  { icon: 'star', text: 'Guaranteed Dating access' },
];

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

export default function SubscriptionScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('quarterly'); // Default to the popular one
  const { tier, isTrialActive, trialExpiresAt } = useSubscriptionStore();
  
  const hasActiveSubscription = tier !== 'free' && isTrialActive();

  const handleSubscribe = async (planId: string) => {
    setLoading(true);
    try {
      // TODO: Implement actual App Store purchase flow
      // For now, show what will happen
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
      Alert.alert(
        '3 Months Free Trial',
        `You're about to start a free 3-month trial for ${plan?.name}.\n\n` +
        `After the trial ends, you'll be charged ${plan?.price} ${plan?.period}.\n\n` +
        `You can cancel anytime in your Apple ID settings.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Start Free Trial', 
            onPress: async () => {
              // Here you would call App Store purchase API
              // Example: await Purchases.purchasePackage(package)
              console.log('Starting subscription for:', planId);
              Alert.alert('Success!', 'Your 3-month free trial has started. Enjoy all premium features!');
              router.push('/(tabs)/discover');
            }
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Could not start subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <UniversalBackground
      scrollable
      contentContainerStyle={styles.scrollContent}
      title="Premium"
      showBottomNav
    >
      {/* Hero Card */}
      <GlassCard style={styles.heroCard} intensity={32} padding={spacing.xl}>
        <LinearGradient
          colors={hasActiveSubscription 
            ? ['rgba(34,197,94,0.15)', 'rgba(34,197,94,0.05)'] 
            : ['rgba(255,215,0,0.15)', 'rgba(255,107,157,0.08)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        />
        
        {hasActiveSubscription ? (
          <>
            <View style={[styles.launchBadge, styles.activeBadge]}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={[styles.launchBadgeText, { color: colors.success }]}>ACTIVE</Text>
            </View>
            <Text style={styles.heroTitle}>You're Premium!</Text>
            <Text style={styles.heroSubtitle}>
              Enjoy unlimited access to all features. Your subscription renews automatically.
            </Text>
            <View style={styles.expiryContainer}>
              <Ionicons name="calendar" size={18} color={colors.text.secondary} />
              <Text style={styles.expiryText}>
                {trialExpiresAt ? `Free until ${formatDate(trialExpiresAt)}` : 'Active subscription'}
              </Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.launchBadge}>
              <Ionicons name="gift" size={16} color={colors.secondary} />
              <Text style={styles.launchBadgeText}>3 MONTHS FREE</Text>
            </View>
            <Text style={styles.heroTitle}>Try Premium Free</Text>
            <Text style={styles.heroSubtitle}>
              Start your free 3-month trial. Cancel anytime before it ends and you won't be charged.
            </Text>
          </>
        )}
      </GlassCard>

      {/* Subscription Plans */}
      {!hasActiveSubscription && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Choose Your Plan</Text>
            <Text style={styles.sectionSubtitle}>All plans include 3 months free</Text>
          </View>

          {SUBSCRIPTION_PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            
            return (
              <Pressable
                key={plan.id}
                onPress={() => setSelectedPlan(plan.id)}
                style={{ marginBottom: spacing.md }}
              >
                <GlassCard 
                  style={[
                    styles.planCard,
                    isSelected ? styles.planCardSelected : undefined
                  ].filter(Boolean) as any} 
                  intensity={isSelected ? 24 : 16} 
                  padding={spacing.lg}
                >
                  {isSelected && (
                    <LinearGradient
                      colors={['rgba(139,92,246,0.1)', 'rgba(139,92,246,0.05)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.planGradient}
                    />
                  )}

                  <View style={styles.planHeader}>
                    <View>
                      <View style={styles.planTitleRow}>
                        <Text style={styles.planTitle}>{plan.name}</Text>
                        {plan.popular && (
                          <View style={styles.popularBadge}>
                            <Text style={styles.popularBadgeText}>POPULAR</Text>
                          </View>
                        )}
                      </View>
                      {plan.savings && (
                        <View style={styles.savingsBadge}>
                          <Text style={styles.savingsBadgeText}>{plan.savings}</Text>
                        </View>
                      )}
                    </View>
                    
                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={28} color={colors.primary} />
                    ) : (
                      <View style={styles.radioOuter}>
                        <View style={styles.radioInner} />
                      </View>
                    )}
                  </View>

                  <View style={styles.planPricing}>
                    <View>
                      <Text style={styles.planPrice}>£{plan.price}</Text>
                      <Text style={styles.planBilling}>per {plan.period}</Text>
                    </View>
                    <View style={styles.planPerDay}>
                      <Text style={styles.planPerDayAmount}>{plan.perDay}</Text>
                      <Text style={styles.planPerDayLabel}>per day</Text>
                    </View>
                  </View>
                </GlassCard>
              </Pressable>
            );
          })}

          <View style={styles.trialNotice}>
            <Ionicons name="information-circle" size={20} color={colors.secondary} />
            <Text style={styles.trialNoticeText}>
              Start your 3-month free trial, then £{SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan)?.price}/{SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan)?.period}. Cancel anytime.
            </Text>
          </View>
        </>
      )}

      {/* Features */}
      <GlassCard style={styles.featuresCard} intensity={24} padding={spacing.lg}>
        <Text style={styles.sectionTitle}>
          {hasActiveSubscription ? "What You Have Access To" : "What's Included"}
        </Text>
        <View style={styles.featuresList}>
          {premiumFeatures.map((feature) => (
            <View key={feature.text} style={styles.featureRow}>
              <View style={[styles.featureIcon, hasActiveSubscription && styles.featureIconActive]}>
                <Ionicons name={feature.icon as any} size={20} color={hasActiveSubscription ? colors.success : colors.secondary} />
              </View>
              <Text style={styles.featureText}>{feature.text}</Text>
              <Ionicons name="checkmark" size={20} color={colors.success} />
            </View>
          ))}
        </View>
      </GlassCard>

      {/* CTA */}
      {!hasActiveSubscription && (
        <GlassCard style={styles.ctaCard} intensity={20} padding={spacing.lg}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.secondary} />
          ) : (
            <GoldButton 
              title="Start Free Trial" 
              onPress={() => handleSubscribe(selectedPlan)}
            />
          )}
          <Text style={styles.ctaNote}>
            You won't be charged for 3 months. Cancel anytime.
          </Text>
        </GlassCard>
      )}

      {/* Info */}
      <View style={styles.infoSection}>
        <View style={styles.infoItem}>
          <Ionicons name="information-circle" size={18} color={colors.text.tertiary} />
          <Text style={styles.infoText}>
            {hasActiveSubscription 
              ? "After your free period ends, you can continue with a paid subscription or keep using basic features for free."
              : "After 3 months, you can continue with a paid subscription or keep using basic features free."}
          </Text>
        </View>
      </View>
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
    overflow: 'hidden',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: borderRadius.lg,
  },
  launchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255,215,0,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  activeBadge: {
    backgroundColor: 'rgba(34,197,94,0.2)',
  },
  launchBadgeText: {
    ...typography.caption,
    color: colors.secondary,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  expiryText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  priceOld: {
    ...typography.body,
    color: colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  priceFree: {
    fontSize: 42,
    fontWeight: '800',
    color: colors.secondary,
  },
  pricePeriod: {
    ...typography.body,
    color: colors.text.secondary,
  },
  featuresCard: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
  },
  featuresList: {
    gap: spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,215,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIconActive: {
    backgroundColor: 'rgba(34,197,94,0.1)',
  },
  featureText: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
  },
  ctaCard: {
    gap: spacing.md,
    alignItems: 'center',
  },
  ctaNote: {
    ...typography.caption,
    color: colors.success,
    textAlign: 'center',
  },
  infoSection: {
    paddingHorizontal: spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  infoText: {
    ...typography.caption,
    color: colors.text.tertiary,
    flex: 1,
    lineHeight: 18,
  },
  sectionHeader: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  sectionSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  planCard: {
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardSelected: {
    borderColor: 'rgba(139,92,246,0.3)',
  },
  planGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: borderRadius.lg,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  planTitle: {
    ...typography.h4,
    color: colors.text.primary,
    fontWeight: '700',
  },
  popularBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  popularBadgeText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.surface,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  savingsBadge: {
    marginTop: spacing.xs,
  },
  savingsBadgeText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
  },
  radioOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.text.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  planPricing: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text.primary,
  },
  planBilling: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  planPerDay: {
    alignItems: 'flex-end',
  },
  planPerDayAmount: {
    ...typography.h4,
    color: colors.secondary,
    fontWeight: '700',
  },
  planPerDayLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  trialNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,215,0,0.1)',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
  },
  trialNoticeText: {
    ...typography.body,
    color: colors.text.secondary,
    flex: 1,
    lineHeight: 20,
  },
});