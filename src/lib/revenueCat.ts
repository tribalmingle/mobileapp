import { Platform } from 'react-native';
import { env } from '@/config/env';

type RevenueCatModule = typeof import('react-native-purchases');

export type RevenueCatSubscriptionState = {
  isActive: boolean;
  isTrial: boolean;
  expiresAt: string | null;
};

let revenueCatConfigured = false;
let revenueCatConfiguredUserId: string | null = null;

const getRevenueCatApiKey = () => {
  if (Platform.OS === 'ios') return env.revenueCatIosApiKey;
  if (Platform.OS === 'android') return env.revenueCatAndroidApiKey;
  return undefined;
};

export const isRevenueCatEnabled = () => {
  return Platform.OS !== 'web' && !!getRevenueCatApiKey();
};

const getRevenueCatModule = async (): Promise<RevenueCatModule | null> => {
  if (!isRevenueCatEnabled()) return null;
  try {
    return await import('react-native-purchases');
  } catch (error) {
    console.warn('[RevenueCat] Failed to load native module', error);
    return null;
  }
};

export const initializeRevenueCat = async (appUserId?: string) => {
  const module = await getRevenueCatModule();
  if (!module) return false;

  const Purchases = module.default;
  const apiKey = getRevenueCatApiKey();

  if (!apiKey) return false;

  try {
    if (!revenueCatConfigured) {
      Purchases.setLogLevel(module.LOG_LEVEL.WARN);
      Purchases.configure({ apiKey, appUserID: appUserId || undefined });
      revenueCatConfigured = true;
      revenueCatConfiguredUserId = appUserId || null;
      return true;
    }

    if (appUserId && appUserId !== revenueCatConfiguredUserId) {
      await Purchases.logIn(appUserId);
      revenueCatConfiguredUserId = appUserId;
    }

    if (!appUserId && revenueCatConfiguredUserId) {
      await Purchases.logOut();
      revenueCatConfiguredUserId = null;
    }

    return true;
  } catch (error) {
    console.warn('[RevenueCat] Initialization error', error);
    return false;
  }
};

export const getRevenueCatOfferings = async () => {
  const module = await getRevenueCatModule();
  if (!module) return null;

  try {
    return await module.default.getOfferings();
  } catch (error) {
    console.warn('[RevenueCat] Failed to load offerings', error);
    return null;
  }
};

export const getRevenueCatCustomerInfo = async () => {
  const module = await getRevenueCatModule();
  if (!module) return null;

  try {
    return await module.default.getCustomerInfo();
  } catch (error) {
    console.warn('[RevenueCat] Failed to fetch customer info', error);
    return null;
  }
};

export const purchaseRevenueCatPackage = async (selectedPackage: unknown) => {
  const module = await getRevenueCatModule();
  if (!module) throw new Error('RevenueCat is not configured');

  return module.default.purchasePackage(selectedPackage as never);
};

export const restoreRevenueCatPurchases = async () => {
  const module = await getRevenueCatModule();
  if (!module) throw new Error('RevenueCat is not configured');

  return module.default.restorePurchases();
};

const getRevenueCatUIModule = async (): Promise<any | null> => {
  if (!isRevenueCatEnabled()) return null;
  try {
    const loaded = await import('react-native-purchases-ui');
    return (loaded as any).default || loaded;
  } catch (error) {
    console.warn('[RevenueCat] Failed to load purchases UI module', error);
    return null;
  }
};

export const presentRevenueCatPaywall = async () => {
  const uiModule = await getRevenueCatUIModule();
  if (!uiModule) return null;

  const entitlementIdentifier = env.revenueCatPremiumEntitlement;

  try {
    if (typeof uiModule.presentPaywallIfNeeded === 'function') {
      return await uiModule.presentPaywallIfNeeded({ requiredEntitlementIdentifier: entitlementIdentifier });
    }

    if (typeof uiModule.presentPaywall === 'function') {
      return await uiModule.presentPaywall();
    }

    return null;
  } catch (error) {
    console.warn('[RevenueCat] Failed to present paywall', error);
    throw error;
  }
};

export const presentRevenueCatCustomerCenter = async () => {
  const uiModule = await getRevenueCatUIModule();
  if (!uiModule) return false;

  try {
    if (typeof uiModule.presentCustomerCenter === 'function') {
      await uiModule.presentCustomerCenter();
      return true;
    }

    return false;
  } catch (error) {
    console.warn('[RevenueCat] Failed to present customer center', error);
    throw error;
  }
};

export const getPremiumEntitlementState = (customerInfo: any): RevenueCatSubscriptionState => {
  const entitlementId = env.revenueCatPremiumEntitlement;
  const activeEntitlements = customerInfo?.entitlements?.active || {};
  const entitlement = activeEntitlements[entitlementId] || activeEntitlements.premium;

  if (!entitlement) {
    return {
      isActive: false,
      isTrial: false,
      expiresAt: null,
    };
  }

  return {
    isActive: true,
    isTrial: entitlement.periodType === 'trial',
    expiresAt: entitlement.expirationDate || null,
  };
};
