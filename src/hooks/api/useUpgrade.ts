import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  upgradeApi,
  getMockCurrentPlan,
  getMockAvailablePlans,
  mockInitiateUpgrade,
  mockTrackUpgradeEvent,
} from '@/lib/api';
import type {
  UserPlan,
  UserSubscription,
  UpgradeRequest,
  UpgradeResponse,
  UpgradeAnalytics,
} from '@/types/api';

// Query keys for upgrade-related queries
export const upgradeKeys = {
  all: ['upgrade'] as const,
  currentPlan: () => [...upgradeKeys.all, 'current-plan'] as const,
  availablePlans: () => [...upgradeKeys.all, 'available-plans'] as const,
  analytics: () => [...upgradeKeys.all, 'analytics'] as const,
};

// Hook to get current user plan and subscription
export function useCurrentPlan() {
  return useQuery({
    queryKey: upgradeKeys.currentPlan(),
    queryFn: async () => {
      // Use mock data for development
      if (process.env.NODE_ENV === 'development') {
        return getMockCurrentPlan();
      }
      return upgradeApi.getCurrentPlan();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook to get available plans
export function useAvailablePlans() {
  return useQuery({
    queryKey: upgradeKeys.availablePlans(),
    queryFn: async () => {
      // Use mock data for development
      if (process.env.NODE_ENV === 'development') {
        return getMockAvailablePlans();
      }
      return upgradeApi.getAvailablePlans();
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}

// Hook to initiate upgrade process
export function useInitiateUpgrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (upgradeData: UpgradeRequest) => {
      // Use mock data for development
      if (process.env.NODE_ENV === 'development') {
        return mockInitiateUpgrade(upgradeData);
      }
      return upgradeApi.initiateUpgrade(upgradeData);
    },
    onSuccess: (data) => {
      // Update the current plan cache with the new subscription
      queryClient.setQueryData(upgradeKeys.currentPlan(), (oldData: any) => {
        if (oldData) {
          return {
            ...oldData,
            data: {
              plan: data.data.plan,
              subscription: data.data.subscription,
            },
          };
        }
        return oldData;
      });

      // Invalidate related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: upgradeKeys.currentPlan() });
    },
    onError: (error) => {
      console.error('Upgrade failed:', error);
    },
  });
}

// Hook to track upgrade analytics events
export function useTrackUpgradeEvent() {
  return useMutation({
    mutationFn: async (analytics: UpgradeAnalytics) => {
      // Use mock data for development
      if (process.env.NODE_ENV === 'development') {
        return mockTrackUpgradeEvent(analytics);
      }
      return upgradeApi.trackUpgradeEvent(analytics);
    },
    onError: (error) => {
      console.error('Failed to track upgrade event:', error);
    },
  });
}

// Hook to cancel subscription
export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return upgradeApi.cancelSubscription();
    },
    onSuccess: (data) => {
      // Update the current plan cache with the cancelled subscription
      queryClient.setQueryData(upgradeKeys.currentPlan(), (oldData: any) => {
        if (oldData) {
          return {
            ...oldData,
            data: {
              ...oldData.data,
              subscription: data.data,
            },
          };
        }
        return oldData;
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: upgradeKeys.currentPlan() });
    },
    onError: (error) => {
      console.error('Failed to cancel subscription:', error);
    },
  });
}

// Utility hook to check if user is on a specific plan
export function useIsOnPlan(planType: UserPlan['type']) {
  const { data: currentPlanData } = useCurrentPlan();

  return {
    isOnPlan: currentPlanData?.data.plan.type === planType,
    currentPlan: currentPlanData?.data.plan,
    subscription: currentPlanData?.data.subscription,
  };
}

// Utility hook to check if user can access a feature
export function useCanAccessFeature(feature: keyof UserPlan['limits']) {
  const { data: currentPlanData } = useCurrentPlan();

  if (!currentPlanData?.data.plan) {
    return false;
  }

  const limit = currentPlanData.data.plan.limits[feature];

  // If limit is boolean, return it directly
  if (typeof limit === 'boolean') {
    return limit;
  }

  // If limit is number, -1 means unlimited, 0 means no access
  if (typeof limit === 'number') {
    return limit !== 0;
  }

  return false;
}

// Hook for upgrade navigation and tracking
export function useUpgradeActions() {
  const trackEvent = useTrackUpgradeEvent();
  const initiateUpgrade = useInitiateUpgrade();

  const handleUpgradeClick = (
    source: UpgradeAnalytics['source'],
    planId?: string
  ) => {
    // Track the upgrade click event
    trackEvent.mutate({
      event: 'upgrade_clicked',
      planId,
      source,
      timestamp: new Date().toISOString(),
    });

    // Navigate to upgrade flow (in a real app, this would navigate to a payment page)
    if (planId) {
      // For demo purposes, we'll just initiate the upgrade with the pro plan
      initiateUpgrade.mutate({
        planId,
        billingCycle: 'monthly',
      });
    } else {
      // Navigate to plans page or open upgrade modal
      console.log('Navigate to upgrade page');
    }
  };

  const trackUpgradeView = (source: UpgradeAnalytics['source']) => {
    trackEvent.mutate({
      event: 'upgrade_viewed',
      source,
      timestamp: new Date().toISOString(),
    });
  };

  return {
    handleUpgradeClick,
    trackUpgradeView,
    isUpgrading: initiateUpgrade.isPending,
    upgradeError: initiateUpgrade.error,
  };
}

// Transformers for upgrade data
export const upgradeTransformers = {
  // Format plan price for display
  formatPlanPrice: (
    plan: UserPlan,
    billingCycle: 'monthly' | 'yearly' = 'monthly'
  ) => {
    if (!plan.price) return 'Free';

    const price = plan.price[billingCycle];
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);

    return billingCycle === 'yearly'
      ? `${formatted}/year`
      : `${formatted}/month`;
  },

  // Calculate savings for yearly billing
  calculateYearlySavings: (plan: UserPlan) => {
    if (!plan.price) return 0;

    const monthlyTotal = plan.price.monthly * 12;
    const yearlyPrice = plan.price.yearly;
    const savings = monthlyTotal - yearlyPrice;

    return Math.round((savings / monthlyTotal) * 100);
  },

  // Format subscription status for display
  formatSubscriptionStatus: (subscription: UserSubscription) => {
    const statusMap = {
      active: 'Active',
      cancelled: 'Cancelled',
      expired: 'Expired',
      trial: 'Trial',
    };

    return statusMap[subscription.status] || subscription.status;
  },

  // Check if subscription is in trial
  isTrialSubscription: (subscription: UserSubscription) => {
    return (
      subscription.status === 'trial' &&
      subscription.trialEnd &&
      new Date(subscription.trialEnd) > new Date()
    );
  },

  // Get days remaining in trial or subscription
  getDaysRemaining: (subscription: UserSubscription) => {
    const endDate = subscription.trialEnd || subscription.currentPeriodEnd;
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  },
};
