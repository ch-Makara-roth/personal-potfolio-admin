import { useQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardApi, getMockStats, ApiClientError } from '@/lib/api';
import { DashboardStats, ApiResponse } from '@/types/api';

// Query keys for dashboard statistics
export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardQueryKeys.all, 'stats'] as const,
  statByType: (type: string) => [...dashboardQueryKeys.stats(), type] as const,
};

// Hook for fetching all dashboard statistics
export function useDashboardStats(options?: {
  refetchInterval?: number;
  enabled?: boolean;
  useMockData?: boolean;
}) {
  const {
    refetchInterval = 30000, // 30 seconds default
    enabled = true,
    useMockData = process.env.NODE_ENV === 'development',
  } = options || {};

  return useQuery({
    queryKey: dashboardQueryKeys.stats(),
    queryFn: async (): Promise<ApiResponse<DashboardStats>> => {
      // Use mock data in development or when specified
      if (useMockData) {
        return getMockStats();
      }
      return dashboardApi.getStats();
    },
    enabled,
    refetchInterval,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: (failureCount, error) => {
      // Don't retry on client errors (4xx)
      if (
        error instanceof ApiClientError &&
        error.status &&
        error.status >= 400 &&
        error.status < 500
      ) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Hook for fetching individual stat by type
export function useStatByType(
  type: 'applications' | 'interviews' | 'hired',
  options?: {
    enabled?: boolean;
    useMockData?: boolean;
  }
) {
  const {
    enabled = true,
    useMockData = process.env.NODE_ENV === 'development',
  } = options || {};

  return useQuery({
    queryKey: dashboardQueryKeys.statByType(type),
    queryFn: async () => {
      if (useMockData) {
        const mockResponse = await getMockStats();
        return {
          ...mockResponse,
          data: mockResponse.data[type],
        };
      }
      return dashboardApi.getStatByType(type);
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for refreshing dashboard statistics
export function useRefreshDashboardStats() {
  const queryClient = useQueryClient();

  const refreshStats = async () => {
    await queryClient.invalidateQueries({
      queryKey: dashboardQueryKeys.stats(),
    });
  };

  const refreshStatByType = async (
    type: 'applications' | 'interviews' | 'hired'
  ) => {
    await queryClient.invalidateQueries({
      queryKey: dashboardQueryKeys.statByType(type),
    });
  };

  const refreshAll = async () => {
    await queryClient.invalidateQueries({
      queryKey: dashboardQueryKeys.all,
    });
  };

  return {
    refreshStats,
    refreshStatByType,
    refreshAll,
  };
}

// Data transformation utilities
export const statsTransformers = {
  // Format large numbers with commas
  formatCount: (count: number | string): string => {
    if (typeof count === 'string') return count;
    return count.toLocaleString();
  },

  // Format percentage change
  formatPercentChange: (current: number, previous: number): string => {
    if (previous === 0) return '+0%';
    const change = ((current - previous) / previous) * 100;
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  },

  // Calculate trend direction from data array
  getTrendDirection: (data: number[]): 'up' | 'down' | 'neutral' => {
    if (data.length < 2) return 'neutral';
    const first = data[0];
    const last = data[data.length - 1];
    const threshold = 0.05; // 5% threshold for neutral
    const change = (last - first) / first;

    if (Math.abs(change) < threshold) return 'neutral';
    return change > 0 ? 'up' : 'down';
  },

  // Calculate percentage change from trend data
  getTrendPercentage: (data: number[]): number => {
    if (data.length < 2) return 0;
    const first = data[0];
    const last = data[data.length - 1];
    return ((last - first) / first) * 100;
  },

  // Get trend color based on direction and context
  getTrendColor: (
    direction: 'up' | 'down' | 'neutral',
    context: 'positive' | 'negative' | 'neutral' = 'positive'
  ): string => {
    if (direction === 'neutral') return 'text-gray-500';

    if (context === 'positive') {
      return direction === 'up' ? 'text-green-600' : 'text-red-500';
    } else if (context === 'negative') {
      return direction === 'up' ? 'text-red-500' : 'text-green-600';
    }

    return 'text-gray-500';
  },

  // Transform raw API data for StatsCard component
  transformForStatsCard: (
    data: DashboardStats,
    type: 'applications' | 'interviews' | 'hired'
  ) => {
    const statData = data[type];
    const direction = statsTransformers.getTrendDirection(statData.trend || []);
    const percentage = statsTransformers.getTrendPercentage(
      statData.trend || []
    );

    return {
      title: type.charAt(0).toUpperCase() + type.slice(1),
      value: statData.count,
      subtitle: statData.subtitle,
      trend: statData.trend ? { data: statData.trend } : undefined,
      formatValue: statsTransformers.formatCount,
      trendDirection: direction,
      trendPercentage: percentage,
    };
  },
};
