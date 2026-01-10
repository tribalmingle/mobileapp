import apiClient from './client';

export interface ReferralProgress {
  code?: string;
  shareUrl?: string;
  totalReferrals?: number;
  successfulReferrals?: number;
  pendingReferrals?: number;
  rewards?: {
    creditsEarned?: number;
    freeDaysEarned?: number;
    nextReward?: {
      referralsNeeded?: number;
      reward?: string;
    };
  };
  referralHistory?: Array<{
    name?: string;
    signupDate?: string;
    status?: string;
    rewardEarned?: string;
  }>;
}

export const fetchReferralProgress = async (): Promise<ReferralProgress> => {
  const { data } = await apiClient.get<any>('/referrals/progress');
  return {
    code: data?.referralCode || data?.code,
    totalReferrals: data?.totalReferrals,
    successfulReferrals: data?.successfulReferrals,
    pendingReferrals: data?.pendingReferrals,
    rewards: data?.rewards,
    referralHistory: data?.referralHistory,
  };
};

export const fetchReferralCode = async (): Promise<{ code?: string; shareUrl?: string }> => {
  const { data } = await apiClient.get<any>('/referrals/code');
  return { code: data?.code, shareUrl: data?.shareUrl };
};

export const sendReferralInvite = async (payload: { email?: string; phone?: string; name?: string }) => {
  await apiClient.post('/referrals/invite', payload);
};
