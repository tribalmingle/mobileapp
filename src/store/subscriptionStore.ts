import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import * as SecureStore from '@/utils/secureStore';
import apiClient from '@/api/client';

// Custom storage adapter using SecureStore
const secureStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};

export type SubscriptionTier = 'free' | 'trial' | 'premium';

export interface SubscriptionLimits {
  maxMessagesPerPerson: number;
  maxPeoplePerWeek: number;
  canSeeWhoLikedThem: boolean;
  canSeeWhoViewedThem: boolean;
  hasAdvancedFilters: boolean;
}

export const FREE_LIMITS: SubscriptionLimits = {
  maxMessagesPerPerson: 2,
  maxPeoplePerWeek: 5,
  canSeeWhoLikedThem: false,
  canSeeWhoViewedThem: false,
  hasAdvancedFilters: false,
};

export const PREMIUM_LIMITS: SubscriptionLimits = {
  maxMessagesPerPerson: Infinity,
  maxPeoplePerWeek: Infinity,
  canSeeWhoLikedThem: true,
  canSeeWhoViewedThem: true,
  hasAdvancedFilters: true,
};

interface MessageTracking {
  [recipientId: string]: number; // count of messages sent to this person this week
}

interface SubscriptionState {
  tier: SubscriptionTier;
  trialActivatedAt: string | null;
  trialExpiresAt: string | null;
  weeklyMessageTracking: MessageTracking;
  weekStartDate: string | null;
  
  // Computed
  isTrialActive: () => boolean;
  getLimits: () => SubscriptionLimits;
  canMessageUser: (recipientId: string) => { allowed: boolean; reason?: string };
  getPeopleMessagedThisWeek: () => number;
  
  // Actions
  activateTrial: () => Promise<void>;
  trackMessageSent: (recipientId: string) => void;
  resetWeeklyTracking: () => void;
  checkAndResetWeek: () => void;
}

const getWeekStart = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
};

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      tier: 'free',
      trialActivatedAt: null,
      trialExpiresAt: null,
      weeklyMessageTracking: {},
      weekStartDate: null,

      isTrialActive: () => {
        const { tier, trialExpiresAt } = get();
        if (tier !== 'trial' || !trialExpiresAt) return false;
        return new Date(trialExpiresAt) > new Date();
      },

      getLimits: () => {
        const { tier, isTrialActive } = get();
        if (tier === 'premium' || (tier === 'trial' && isTrialActive())) {
          return PREMIUM_LIMITS;
        }
        return FREE_LIMITS;
      },

      canMessageUser: (recipientId: string) => {
        const { getLimits, weeklyMessageTracking, getPeopleMessagedThisWeek, checkAndResetWeek } = get();
        checkAndResetWeek();
        
        const limits = getLimits();
        
        // Premium users have no limits
        if (limits.maxMessagesPerPerson === Infinity) {
          return { allowed: true };
        }
        
        const messagesSentToUser = weeklyMessageTracking[recipientId] || 0;
        const peopleMessaged = getPeopleMessagedThisWeek();
        
        // Already messaged this person - check per-person limit
        if (messagesSentToUser > 0) {
          if (messagesSentToUser >= limits.maxMessagesPerPerson) {
            return { 
              allowed: false, 
              reason: `You've reached your limit of ${limits.maxMessagesPerPerson} messages to this person this week. Activate your free trial to message unlimited!` 
            };
          }
          return { allowed: true };
        }
        
        // New person - check weekly people limit
        if (peopleMessaged >= limits.maxPeoplePerWeek) {
          return { 
            allowed: false, 
            reason: `You can only message ${limits.maxPeoplePerWeek} people per week on the free plan. Activate your free trial for unlimited messaging!` 
          };
        }
        
        return { allowed: true };
      },

      getPeopleMessagedThisWeek: () => {
        const { weeklyMessageTracking } = get();
        return Object.keys(weeklyMessageTracking).length;
      },

      activateTrial: async () => {
        try {
          const response = await apiClient.post('/subscription/activate-trial');
          const { trialExpiresAt } = response.data;
          
          set({
            tier: 'trial',
            trialActivatedAt: new Date().toISOString(),
            trialExpiresAt,
          });
        } catch (error: any) {
          // If backend fails, still activate locally (for demo/offline)
          const expiresAt = new Date();
          expiresAt.setMonth(expiresAt.getMonth() + 3);
          
          set({
            tier: 'trial',
            trialActivatedAt: new Date().toISOString(),
            trialExpiresAt: expiresAt.toISOString(),
          });
        }
      },

      trackMessageSent: (recipientId: string) => {
        const { weeklyMessageTracking, checkAndResetWeek } = get();
        checkAndResetWeek();
        
        set({
          weeklyMessageTracking: {
            ...weeklyMessageTracking,
            [recipientId]: (weeklyMessageTracking[recipientId] || 0) + 1,
          },
        });
      },

      resetWeeklyTracking: () => {
        set({
          weeklyMessageTracking: {},
          weekStartDate: getWeekStart(),
        });
      },

      checkAndResetWeek: () => {
        const { weekStartDate, resetWeeklyTracking } = get();
        const currentWeekStart = getWeekStart();
        
        if (!weekStartDate || weekStartDate !== currentWeekStart) {
          resetWeeklyTracking();
        }
      },
    }),
    {
      name: 'subscription-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        tier: state.tier,
        trialActivatedAt: state.trialActivatedAt,
        trialExpiresAt: state.trialExpiresAt,
        weeklyMessageTracking: state.weeklyMessageTracking,
        weekStartDate: state.weekStartDate,
      }),
    }
  )
);
