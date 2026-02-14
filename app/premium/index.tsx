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
import { useAuthStore } from '@/store/authStore';
import {
  getPremiumEntitlementState,
  getRevenueCatCustomerInfo,
  getRevenueCatOfferings,
  initializeRevenueCat,
  isRevenueCatEnabled,
  presentRevenueCatCustomerCenter,
  presentRevenueCatPaywall,
  purchaseRevenueCatPackage,
  restoreRevenueCatPurchases,
} from '@/lib/revenueCat';

// App Store Product IDs
const SUBSCRIPTION_PRODUCTS = {
  monthly: 'com.tribalmingle.com.monthly',
  quarterly: 'com.tribalmingle.com.quarterly',
  biannual: 'com.tribalmingle.com.biannual',
  yearly: 'com.tribalmingle.com.yearly',
} as const;

// One-time purchase product IDs
const ONETIME_PRODUCTS = {
  guaranteedDating: 'com.tribalmingle.com.concierge',
} as const;

const SUBSCRIPTION_PLANS = [
  {
    id: 'monthly',
    packageId: 'monthly',
    productId: SUBSCRIPTION_PRODUCTS.monthly,
    name: 'Monthly',
    fallbackPrice: '$15.00',
    period: 'per month',
    perDay: '$0.50/day',
    popular: false,
  },
  {
    id: 'three_month',
    packageId: 'three_month',
    productId: SUBSCRIPTION_PRODUCTS.quarterly,
    name: '3 Months',
    fallbackPrice: '$39.00',
    period: 'for 3 months',
    perDay: '$0.43/day',
    popular: true,
    savings: 'Most Popular',
  },
  {
    id: 'six_month',
    packageId: 'six_month',
    productId: SUBSCRIPTION_PRODUCTS.biannual,
    name: '6 Months',
    fallbackPrice: '$60.00',
    period: 'for 6 months',
    perDay: '$0.33/day',
    popular: false,
    savings: 'Best Savings',
  },
  {
    id: 'yearly',
    packageId: 'yearly',
    productId: SUBSCRIPTION_PRODUCTS.yearly,
    name: '12 Months',
    fallbackPrice: '$100.00',
    period: 'per year',
    perDay: '$0.27/day',
    popular: false,
    savings: 'Best Value',
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
  const [paywallLoading, setPaywallLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('three_month'); // Default to the popular one
  const [packagesByPlan, setPackagesByPlan] = useState<Record<string, any>>({});
  const [offeringsLoading, setOfferingsLoading] = useState(true);
  const { tier, isTrialActive, trialExpiresAt, setRevenueCatSubscription, chooseFreeAccess } = useSubscriptionStore();
  const user = useAuthStore((state) => state.user);
  
  const hasActiveSubscription = tier === 'premium' || isTrialActive();

  useEffect(() => {
    let active = true;

    const loadRevenueCatData = async () => {
      setOfferingsLoading(true);
      try {
        const appUserId = user?._id || user?.id;
        await initializeRevenueCat(appUserId);

        const [offerings, customerInfo] = await Promise.all([
          getRevenueCatOfferings(),
          getRevenueCatCustomerInfo(),
        ]);

        if (!active) return;

        const packages = offerings?.current?.availablePackages || [];
        const byPlan = SUBSCRIPTION_PLANS.reduce<Record<string, any>>((acc, plan) => {
          const matchingPackage = packages.find(
            (pkg: any) => pkg?.identifier === plan.packageId || pkg?.product?.identifier === plan.productId
          );
          if (matchingPackage) acc[plan.id] = matchingPackage;
          return acc;
        }, {});

        setPackagesByPlan(byPlan);

        if (customerInfo) {
          setRevenueCatSubscription(getPremiumEntitlementState(customerInfo));
        }
      } catch (error) {
        console.warn('[RevenueCat] Failed to load offerings', error);
      } finally {
        if (active) setOfferingsLoading(false);
      }
    };

    loadRevenueCatData();

    return () => {
      active = false;
    };
  }, [user?._id, user?.id, setRevenueCatSubscription]);

  const getPlanPrice = (planId: string, fallbackPrice: string) => {
    const selectedPackage = packagesByPlan[planId];
    const livePrice = selectedPackage?.product?.priceString;
    return livePrice || fallbackPrice;
  };

  const handleSubscribe = async (planId: string) => {
    if (!isRevenueCatEnabled()) {
      Alert.alert(
        'Purchases not configured',
        'RevenueCat API key is missing. Set EXPO_PUBLIC_REVENUECAT_IOS_API_KEY and rebuild the app.'
      );
      return;
    }

    const selectedPackage = packagesByPlan[planId];
    if (!selectedPackage) {
      Alert.alert('Plan unavailable', 'This subscription plan is not currently available. Please try again later.');
      return;
    }

    setLoading(true);
    try {
      const result = await purchaseRevenueCatPackage(selectedPackage);
      const status = getPremiumEntitlementState(result?.customerInfo);
      setRevenueCatSubscription(status);

      if (!status.isActive) {
        Alert.alert('Purchase incomplete', 'No active entitlement was found after purchase. Please try Restore Purchases.');
        return;
      }

      Alert.alert('Success', 'Your subscription is now active. Enjoy premium features!');
      router.push('/(tabs)/discover');
    } catch (error: any) {
      if (error?.userCancelled) {
        return;
      }
      Alert.alert('Purchase failed', error?.message || 'Could not start subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPaywall = async () => {
    if (!isRevenueCatEnabled()) {
      Alert.alert(
        'Purchases not configured',
        'RevenueCat API key is missing. Set EXPO_PUBLIC_REVENUECAT_IOS_API_KEY and rebuild the app.'
      );
      return;
    }

    setPaywallLoading(true);
    try {
      await presentRevenueCatPaywall();
      const customerInfo = await getRevenueCatCustomerInfo();
      if (customerInfo) {
        const status = getPremiumEntitlementState(customerInfo);
        setRevenueCatSubscription(status);
        if (status.isActive) {
          Alert.alert('Success', 'Your subscription is now active.');
          router.replace('/(tabs)/discover');
        }
      }
    } catch (error: any) {
      Alert.alert('Paywall failed', error?.message || 'Could not open paywall. Please try again.');
    } finally {
      setPaywallLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!isRevenueCatEnabled()) {
      Alert.alert(
        'Purchases not configured',
        'RevenueCat API key is missing. Set EXPO_PUBLIC_REVENUECAT_IOS_API_KEY and rebuild the app.'
      );
      return;
    }

    setRestoring(true);
    try {
      const customerInfo = await restoreRevenueCatPurchases();
      const status = getPremiumEntitlementState(customerInfo);
      setRevenueCatSubscription(status);

      if (status.isActive) {
        Alert.alert('Restored', 'Your subscription has been restored successfully.');
      } else {
        Alert.alert('No purchases found', 'No active subscriptions were found to restore for this Apple ID.');
      }
    } catch (error: any) {
      Alert.alert('Restore failed', error?.message || 'Could not restore purchases. Please try again.');
    } finally {
      setRestoring(false);
    }
  };

  const handleContinueFree = () => {
    chooseFreeAccess();
    router.replace('/(tabs)/discover');
  };

  const handleOpenCustomerCenter = async () => {
    if (!isRevenueCatEnabled()) {
      Alert.alert('Unavailable', 'RevenueCat is not configured for this build.');
      return;
    }

    try {
      const opened = await presentRevenueCatCustomerCenter();
      if (!opened) {
        Alert.alert('Unavailable', 'Customer Center is not enabled in RevenueCat dashboard yet.');
      }
    } catch (error: any) {
      Alert.alert('Unavailable', error?.message || 'Could not open Customer Center.');
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
              <Text style={styles.launchBadgeText}>3-MONTH INTRO OFFER</Text>
            </View>
            <Text style={styles.heroTitle}>Try Premium Free</Text>
            <Text style={styles.heroSubtitle}>
              Introductory offer: first 3 months free for eligible new subscribers. After that, a paid plan is required to continue.
            </Text>
          </>
        )}
      </GlassCard>

      {/* Subscription Plans */}
      {!hasActiveSubscription && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Choose Your Plan</Text>
            <Text style={styles.sectionSubtitle}>First 3 months free (eligible subscribers)</Text>
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
                      <Text style={styles.planPrice}>{getPlanPrice(plan.id, plan.fallbackPrice)}</Text>
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
              Start your 3-month free trial, then {getPlanPrice(
                selectedPlan,
                SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlan)?.fallbackPrice || ''
              )}/{SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlan)?.period}. Cancel anytime.
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
          {loading || offeringsLoading ? (
            <ActivityIndicator size="large" color={colors.secondary} />
          ) : (
            <View style={styles.ctaActions}>
              <GoldButton 
                title="Start Free Trial" 
                onPress={() => handleSubscribe(selectedPlan)}
              />
              <TouchableOpacity onPress={handleOpenPaywall} disabled={paywallLoading} style={styles.inlineActionButton}>
                <Text style={styles.inlineActionText}>{paywallLoading ? 'Opening Paywall...' : 'Open RevenueCat Paywall'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleOpenCustomerCenter} style={styles.inlineActionButton}>
                <Text style={styles.inlineActionText}>Manage Subscription (Customer Center)</Text>
              </TouchableOpacity>
            </View>
          )}
          {!loading && !offeringsLoading && (
            <TouchableOpacity onPress={handleRestore} disabled={restoring} style={styles.restoreButton}>
              <Text style={styles.restoreText}>{restoring ? 'Restoring...' : 'Restore Purchases'}</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.ctaNote}>
            First 3 months free for eligible subscribers, then billing continues automatically.
          </Text>
          <TouchableOpacity onPress={handleContinueFree} style={styles.continueFreeButton}>
            <Text style={styles.continueFreeText}>Continue with Free Plan</Text>
          </TouchableOpacity>
        </GlassCard>
      )}

      {/* Info */}
      <View style={styles.infoSection}>
        <View style={styles.infoItem}>
          <Ionicons name="information-circle" size={18} color={colors.text.tertiary} />
          <Text style={styles.infoText}>
            {hasActiveSubscription 
              ? "After your introductory period ends, your selected paid subscription continues automatically unless canceled in Apple ID settings."
              : "After the introductory period, a paid subscription is required to continue using TribalMingle."}
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
  ctaActions: {
    width: '100%',
    gap: spacing.sm,
  },
  ctaNote: {
    ...typography.caption,
    color: colors.success,
    textAlign: 'center',
  },
  restoreButton: {
    marginTop: spacing.md,
    alignSelf: 'center',
  },
  restoreText: {
    ...typography.body,
    color: colors.secondary,
  },
  continueFreeButton: {
    marginTop: spacing.xs,
  },
  continueFreeText: {
    ...typography.caption,
    color: colors.text.secondary,
    textDecorationLine: 'underline',
  },
  inlineActionButton: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  inlineActionText: {
    ...typography.caption,
    color: colors.secondary,
    textDecorationLine: 'underline',
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