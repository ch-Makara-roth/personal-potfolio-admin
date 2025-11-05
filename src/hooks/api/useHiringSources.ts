import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  hiringSourcesApi,
  getMockHiringSources,
  ApiClientError,
} from '@/lib/api';
import { HiringSourcesData, HiringSource, ApiResponse } from '@/types/api';

// Query keys for hiring sources analytics
export const hiringSourcesQueryKeys = {
  all: ['hiringSources'] as const,
  data: () => [...hiringSourcesQueryKeys.all, 'data'] as const,
  byCategory: (category: string) =>
    [...hiringSourcesQueryKeys.all, 'category', category] as const,
};

// Hook for fetching hiring sources analytics data
export function useHiringSources(options?: {
  refetchInterval?: number;
  enabled?: boolean;
  useMockData?: boolean;
}) {
  const {
    refetchInterval = 60000, // 1 minute default (less frequent than dashboard stats)
    enabled = true,
    useMockData = process.env.NODE_ENV === 'development',
  } = options || {};

  return useQuery({
    queryKey: hiringSourcesQueryKeys.data(),
    queryFn: async (): Promise<ApiResponse<HiringSourcesData>> => {
      // Use mock data in development or when specified
      if (useMockData) {
        return getMockHiringSources();
      }
      return hiringSourcesApi.getHiringSources();
    },
    enabled,
    refetchInterval,
    staleTime: 10 * 60 * 1000, // 10 minutes (analytics data changes less frequently)
    gcTime: 30 * 60 * 1000, // 30 minutes
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

// Hook for fetching hiring sources by category
export function useHiringSourcesByCategory(
  category: 'design' | 'engineering' | 'marketing',
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
    queryKey: hiringSourcesQueryKeys.byCategory(category),
    queryFn: async () => {
      if (useMockData) {
        const mockResponse = await getMockHiringSources();
        const filteredSources = mockResponse.data.sources.filter(
          (source) => source.category === category
        );
        return {
          ...mockResponse,
          data: filteredSources,
        };
      }
      return hiringSourcesApi.getHiringSourcesByCategory(category);
    },
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Hook for refreshing hiring sources data
export function useRefreshHiringSources() {
  const queryClient = useQueryClient();

  const refreshHiringSources = async () => {
    await queryClient.invalidateQueries({
      queryKey: hiringSourcesQueryKeys.data(),
    });
  };

  const refreshByCategory = async (
    category: 'design' | 'engineering' | 'marketing'
  ) => {
    await queryClient.invalidateQueries({
      queryKey: hiringSourcesQueryKeys.byCategory(category),
    });
  };

  const refreshAll = async () => {
    await queryClient.invalidateQueries({
      queryKey: hiringSourcesQueryKeys.all,
    });
  };

  return {
    refreshHiringSources,
    refreshByCategory,
    refreshAll,
  };
}

// Data transformation utilities for hiring sources
export const hiringSourcesTransformers = {
  // Sort sources by value (descending)
  sortByValue: (sources: HiringSource[]): HiringSource[] => {
    return [...sources].sort((a, b) => b.value - a.value);
  },

  // Filter sources by category
  filterByCategory: (
    sources: HiringSource[],
    categories: string[]
  ): HiringSource[] => {
    return sources.filter((source) => categories.includes(source.category));
  },

  // Get top N sources
  getTopSources: (sources: HiringSource[], limit: number): HiringSource[] => {
    return hiringSourcesTransformers.sortByValue(sources).slice(0, limit);
  },

  // Calculate category totals
  getCategoryTotals: (sources: HiringSource[]): Record<string, number> => {
    return sources.reduce(
      (acc, source) => {
        acc[source.category] = (acc[source.category] || 0) + source.value;
        return acc;
      },
      {} as Record<string, number>
    );
  },

  // Get category statistics
  getCategoryStats: (sources: HiringSource[]) => {
    const categories = [...new Set(sources.map((s) => s.category))];

    return categories.map((category) => {
      const categorySources = sources.filter((s) => s.category === category);
      const total = categorySources.reduce((sum, s) => sum + s.value, 0);
      const average = total / categorySources.length;
      const max = Math.max(...categorySources.map((s) => s.value));
      const min = Math.min(...categorySources.map((s) => s.value));

      return {
        category,
        count: categorySources.length,
        total,
        average: Math.round(average * 100) / 100,
        max,
        min,
        sources: categorySources,
      };
    });
  },

  // Format value for display
  formatValue: (value: number): string => {
    return value.toString();
  },

  // Get percentage of total
  getPercentageOfTotal: (value: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100 * 100) / 100; // Round to 2 decimal places
  },

  // Transform data for chart component
  transformForChart: (data: HiringSourcesData) => {
    const sortedSources = hiringSourcesTransformers.sortByValue(data.sources);
    const categoryStats = hiringSourcesTransformers.getCategoryStats(
      data.sources
    );

    return {
      sources: sortedSources,
      categories: categoryStats,
      lastUpdated: data.lastUpdated,
      totalSources: data.sources.length,
      maxValue: Math.max(...data.sources.map((s) => s.value)),
      minValue: Math.min(...data.sources.map((s) => s.value)),
      averageValue:
        Math.round(
          (data.sources.reduce((sum, s) => sum + s.value, 0) /
            data.sources.length) *
            100
        ) / 100,
    };
  },

  // Get color for category
  getCategoryColor: (
    category: string,
    categoryColors: Record<string, string>
  ): string => {
    return categoryColors[category] || '#6B7280'; // Default gray
  },

  // Generate chart-ready data
  generateChartData: (
    sources: HiringSource[],
    activeCategories: Set<string>
  ): HiringSource[] => {
    return sources
      .filter((source) => activeCategories.has(source.category))
      .sort((a, b) => b.value - a.value);
  },
};

// Real-time data update hook
export function useHiringSourcesRealTime(options?: {
  enabled?: boolean;
  interval?: number;
}) {
  const {
    enabled = true,
    interval = 300000, // 5 minutes default
  } = options || {};

  const queryClient = useQueryClient();

  // Set up real-time updates
  const { data, isLoading, error } = useHiringSources({
    refetchInterval: enabled ? interval : undefined,
    enabled,
  });

  // Manual refresh function
  const refresh = async () => {
    await queryClient.invalidateQueries({
      queryKey: hiringSourcesQueryKeys.data(),
    });
  };

  return {
    data: data?.data,
    isLoading,
    error,
    refresh,
    lastUpdated: data?.data?.lastUpdated,
  };
}
