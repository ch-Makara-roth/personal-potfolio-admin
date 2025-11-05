import { apiRequest } from './client';

export const upgradeApi = {
  getCurrentPlan: async (): Promise<
    import('@/types/api').ApiResponse<{
      plan: import('@/types/api').UserPlan;
      subscription: import('@/types/api').UserSubscription;
    }>
  > => {
    return apiRequest<{
      plan: import('@/types/api').UserPlan;
      subscription: import('@/types/api').UserSubscription;
    }>('/user/plan');
  },
  getAvailablePlans: async (): Promise<
    import('@/types/api').ApiResponse<import('@/types/api').UserPlan[]>
  > => {
    return apiRequest<import('@/types/api').UserPlan[]>('/plans');
  },
  initiateUpgrade: async (
    upgradeData: import('@/types/api').UpgradeRequest
  ): Promise<
    import('@/types/api').ApiResponse<import('@/types/api').UpgradeResponse>
  > => {
    return apiRequest<import('@/types/api').UpgradeResponse>('/user/upgrade', {
      method: 'POST',
      body: JSON.stringify(upgradeData),
    });
  },
  trackUpgradeEvent: async (
    analytics: import('@/types/api').UpgradeAnalytics
  ): Promise<import('@/types/api').ApiResponse<void>> => {
    return apiRequest<void>('/analytics/upgrade', {
      method: 'POST',
      body: JSON.stringify(analytics),
    });
  },
  cancelSubscription: async (): Promise<
    import('@/types/api').ApiResponse<import('@/types/api').UserSubscription>
  > => {
    return apiRequest<import('@/types/api').UserSubscription>(
      '/user/subscription/cancel',
      {
        method: 'POST',
      }
    );
  },
};
