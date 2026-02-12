import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { ApiClientError } from './api/core';

// Global error handler for queries
const handleQueryError = (error: unknown) => {
  if (error instanceof ApiClientError) {
    console.error('Query Error:', {
      code: error.code,
      message: error.message,
      status: error.status,
      details: error.details,
    });

    // Handle specific error types
    switch (error.code) {
      case 'NETWORK_ERROR':
        // Could show offline notification
        break;
      case 'TIMEOUT':
        // Could show timeout notification
        break;
      case 'SERVER_ERROR':
        // Could show server error notification
        break;
      default:
        // Generic error handling
        break;
    }

    return error;
  }

  console.error('Unknown query error:', error);
  return new ApiClientError('UNKNOWN_ERROR', 'An unexpected error occurred');
};

// Global error handler for mutations
const handleMutationError = (error: unknown) => {
  if (error instanceof ApiClientError) {
    console.error('Mutation Error:', {
      code: error.code,
      message: error.message,
      status: error.status,
      details: error.details,
    });

    // Handle specific mutation error types
    switch (error.code) {
      case 'VALIDATION_ERROR':
        // Could show form validation errors
        break;
      case 'AUTHORIZATION_ERROR':
        // Could redirect to login
        break;
      case 'CONFLICT_ERROR':
        // Could show conflict resolution UI
        break;
      default:
        // Generic mutation error handling
        break;
    }

    return error;
  }

  console.error('Unknown mutation error:', error);
  return new ApiClientError('UNKNOWN_ERROR', 'An unexpected error occurred');
};

// Create a new QueryClient instance with optimized defaults and error handling
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: handleQueryError,
  }),
  mutationCache: new MutationCache({
    onError: handleMutationError,
  }),
  defaultOptions: {
    queries: {
      // Stale-while-revalidate strategy
      staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes

      // Cache time: how long data stays in cache after component unmounts
      gcTime: 30 * 60 * 1000, // 30 minutes (increased for better UX)

      // Retry configuration with intelligent logic
      retry: (failureCount, error) => {
        // Don't retry on client errors (4xx) except for 408 (timeout) and 429 (rate limit)
        if (error instanceof ApiClientError && error.status) {
          if (error.status >= 400 && error.status < 500) {
            return error.status === 408 || error.status === 429
              ? failureCount < 2
              : false;
          }
        }

        // Don't retry on network errors after 2 attempts
        if (error instanceof ApiClientError && error.code === 'NETWORK_ERROR') {
          return failureCount < 2;
        }

        // Retry up to 3 times for server errors (5xx)
        return failureCount < 3;
      },

      // Exponential backoff with jitter for retries
      retryDelay: (attemptIndex) => {
        const baseDelay = Math.min(1000 * 2 ** attemptIndex, 30000);
        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 0.1 * baseDelay;
        return baseDelay + jitter;
      },

      // Background refetch configuration
      refetchOnWindowFocus: true, // Refetch when user returns to tab
      refetchOnReconnect: true, // Refetch when network reconnects
      refetchOnMount: 'always', // Always refetch on component mount for fresh data

      // Network mode configuration
      networkMode: 'online', // Only fetch when online

      // Refetch interval for real-time data (disabled by default, enabled per query)
      refetchInterval: false,
      refetchIntervalInBackground: false,
    },
    mutations: {
      // Retry mutations with more conservative approach
      retry: (failureCount, error) => {
        // Don't retry client errors except for network issues
        if (error instanceof ApiClientError) {
          if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT') {
            return failureCount < 2;
          }
          // Don't retry validation or authorization errors
          if (
            error.code === 'VALIDATION_ERROR' ||
            error.code === 'AUTHORIZATION_ERROR'
          ) {
            return false;
          }
        }

        // Retry server errors once
        return failureCount < 1;
      },

      // Retry delay for mutations (shorter than queries)
      retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 5000),

      // Network mode for mutations
      networkMode: 'online',
    },
  },
});

// Background synchronization configuration
export const backgroundSyncConfig = {
  // Interval for background data refresh (when app is visible)
  backgroundRefreshInterval: 5 * 60 * 1000, // 5 minutes

  // Interval for critical data refresh (dashboard stats, notifications)
  criticalDataRefreshInterval: 2 * 60 * 1000, // 2 minutes

  // Maximum age before forcing a refresh
  maxStaleTime: 15 * 60 * 1000, // 15 minutes
};

// Network status tracking
let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
let networkStatusListeners: Array<(online: boolean) => void> = [];

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    isOnline = true;
    networkStatusListeners.forEach((listener) => listener(true));

    // Refetch all queries when coming back online
    queryClient.refetchQueries({
      type: 'active',
      stale: true,
    });
  });

  window.addEventListener('offline', () => {
    isOnline = false;
    networkStatusListeners.forEach((listener) => listener(false));
  });
}

export const getNetworkStatus = () => isOnline;

export const onNetworkStatusChange = (listener: (online: boolean) => void) => {
  networkStatusListeners.push(listener);

  // Return cleanup function
  return () => {
    networkStatusListeners = networkStatusListeners.filter(
      (l) => l !== listener
    );
  };
};

// Enhanced error handling utilities
export const createRetryableError = (
  message: string,
  code: string = 'RETRYABLE_ERROR'
) => {
  return new ApiClientError(code, message);
};

export const createNonRetryableError = (
  message: string,
  code: string = 'NON_RETRYABLE_ERROR'
) => {
  const error = new ApiClientError(code, message);
  // Mark as non-retryable
  (error as any).retryable = false;
  return error;
};

// Background synchronization utilities
export const startBackgroundSync = () => {
  if (typeof window === 'undefined') return;

  // Set up periodic background refresh for critical data
  const criticalDataInterval = setInterval(() => {
    if (isOnline && !document.hidden) {
      // Refetch critical dashboard data
      queryClient.refetchQueries({
        queryKey: ['dashboard'],
        type: 'active',
        stale: true,
      });

      // Refetch notification data
      queryClient.refetchQueries({
        queryKey: ['notifications'],
        type: 'active',
        stale: true,
      });
    }
  }, backgroundSyncConfig.criticalDataRefreshInterval);

  // Set up periodic background refresh for all data
  const backgroundRefreshInterval = setInterval(() => {
    if (isOnline && !document.hidden) {
      queryClient.refetchQueries({
        type: 'active',
        stale: true,
      });
    }
  }, backgroundSyncConfig.backgroundRefreshInterval);

  // Handle visibility change
  const handleVisibilityChange = () => {
    if (!document.hidden && isOnline) {
      // Refetch stale queries when app becomes visible
      queryClient.refetchQueries({
        type: 'active',
        stale: true,
      });
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Return cleanup function
  return () => {
    clearInterval(criticalDataInterval);
    clearInterval(backgroundRefreshInterval);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
};

// Utility function to prefetch dashboard stats
export const prefetchDashboardStats = async () => {
  const { dashboardQueryKeys } = await import('@/hooks/api');
  const { getMockStats } = await import('./api');

  await queryClient.prefetchQuery({
    queryKey: dashboardQueryKeys.stats(),
    queryFn: getMockStats,
    staleTime: backgroundSyncConfig.criticalDataRefreshInterval,
  });
};

// Utility function to prefetch all critical dashboard data
export const prefetchCriticalData = async () => {
  try {
    const [
      { dashboardQueryKeys },
      { calendarKeys },
      { interviewKeys },
      { getMockStats, getMockCalendarEvents, getMockInterviews },
    ] = await Promise.all([
      import('@/hooks/api'),
      import('@/hooks/api'),
      import('@/hooks/api'),
      import('./api'),
    ]);

    // Prefetch dashboard stats
    queryClient.prefetchQuery({
      queryKey: dashboardQueryKeys.stats(),
      queryFn: getMockStats,
      staleTime: backgroundSyncConfig.criticalDataRefreshInterval,
    });

    // Prefetch current month calendar events
    const now = new Date();
    queryClient.prefetchQuery({
      queryKey: calendarKeys.eventsByMonth(
        now.getFullYear(),
        now.getMonth() + 1
      ),
      queryFn: () =>
        getMockCalendarEvents(now.getFullYear(), now.getMonth() + 1),
      staleTime: backgroundSyncConfig.backgroundRefreshInterval,
    });

    // Prefetch upcoming interviews
    queryClient.prefetchQuery({
      queryKey: interviewKeys.upcoming(),
      queryFn: () => getMockInterviews(5),
      staleTime: backgroundSyncConfig.criticalDataRefreshInterval,
    });
  } catch (error) {
    console.error('Failed to prefetch critical data:', error);
  }
};

// Utility function to invalidate all dashboard queries
export const invalidateDashboardQueries = async () => {
  const { dashboardQueryKeys } = await import('@/hooks/api');

  await queryClient.invalidateQueries({
    queryKey: dashboardQueryKeys.all,
  });
};

// Utility function to invalidate queries by pattern
export const invalidateQueriesByPattern = async (pattern: string[]) => {
  await queryClient.invalidateQueries({
    queryKey: pattern,
  });
};

// Utility function to remove queries by pattern
export const removeQueriesByPattern = (pattern: string[]) => {
  queryClient.removeQueries({
    queryKey: pattern,
  });
};

// Utility function to clear all queries (useful for logout)
export const clearAllQueries = () => {
  queryClient.clear();
};

// Utility function to get query data without subscribing
export const getQueryData = <T>(queryKey: string[]): T | undefined => {
  return queryClient.getQueryData<T>(queryKey);
};

// Utility function to set query data manually
export const setQueryData = <T>(queryKey: string[], data: T) => {
  queryClient.setQueryData<T>(queryKey, data);
};

// Utility function to check if query is loading
export const isQueryLoading = (queryKey: string[]): boolean => {
  const query = queryClient.getQueryState(queryKey);
  return query?.status === 'pending';
};

// Utility function to check if query has error
export const getQueryError = (queryKey: string[]): Error | null => {
  const query = queryClient.getQueryState(queryKey);
  return query?.error || null;
};

// Utility function to force refresh specific queries
export const forceRefreshQueries = async (queryKeys: string[][]) => {
  const promises = queryKeys.map((queryKey) =>
    queryClient.refetchQueries({
      queryKey,
      type: 'active',
    })
  );

  await Promise.allSettled(promises);
};
