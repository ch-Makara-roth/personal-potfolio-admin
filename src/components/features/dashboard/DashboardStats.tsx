import React from 'react';
import { FileText, Circle, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { StatsCard } from '@/components/ui';
import { StatsCardSkeleton } from '@/components/ui/Skeleton';
import {
  useDashboardStats,
  useRefreshDashboardStats,
  statsTransformers,
} from '@/hooks/api';
import {
  useResponsiveGrid,
  useResponsiveSpacing,
  useBreakpoint,
} from '@/hooks/useResponsive';

// Error component
interface ErrorDisplayProps {
  error: Error;
  onRetry: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry }) => (
  <div className="bg-white dark:bg-gray-900 rounded-xl border border-red-200 dark:border-red-900/50 p-6">
    <div className="flex items-center space-x-3 mb-4">
      <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg p-2">
        <AlertCircle className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Error Loading Statistics
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {error.message}
        </p>
      </div>
    </div>
    <button
      onClick={onRetry}
      className="inline-flex items-center space-x-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
    >
      <RefreshCw className="h-4 w-4" />
      <span>Try Again</span>
    </button>
  </div>
);

// Main dashboard stats component
export interface DashboardStatsProps {
  className?: string;
  showRefreshButton?: boolean;
  useMockData?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  className = '',
  showRefreshButton = true,
  useMockData,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}) => {
  const {
    data: response,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useDashboardStats({
    refetchInterval: autoRefresh ? refreshInterval : undefined,
    useMockData,
  });

  const { refreshStats } = useRefreshDashboardStats();
  const { gridClasses } = useResponsiveGrid(3);
  const { getSpacing } = useResponsiveSpacing();
  const { isMobile } = useBreakpoint();

  const handleRefresh = async () => {
    await refreshStats();
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className={`grid ${gridClasses} gap-4 md:gap-6 ${className}`}>
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={`grid ${gridClasses} gap-4 md:gap-6 ${className}`}>
        <ErrorDisplay error={error as Error} onRetry={() => refetch()} />
        <ErrorDisplay error={error as Error} onRetry={() => refetch()} />
        <ErrorDisplay error={error as Error} onRetry={() => refetch()} />
      </div>
    );
  }

  // No data state
  if (!response?.data) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500 dark:text-gray-400">
          No statistics data available
        </p>
      </div>
    );
  }

  const stats = response.data;

  // Transform data for each stat card
  const applicationsData = statsTransformers.transformForStatsCard(
    stats,
    'applications'
  );
  const interviewsData = statsTransformers.transformForStatsCard(
    stats,
    'interviews'
  );
  const hiredData = statsTransformers.transformForStatsCard(stats, 'hired');

  return (
    <div className={className}>
      {/* Header with refresh button */}
      {showRefreshButton && (
        <div
          className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'} mb-6`}
        >
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100">
            Dashboard Statistics
          </h2>
          <button
            onClick={handleRefresh}
            disabled={isRefetching}
            className={`inline-flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
              isMobile ? 'self-start' : ''
            }`}
            aria-label={
              isRefetching ? 'Refreshing statistics' : 'Refresh statistics'
            }
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>{isRefetching ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      )}

      {/* Stats cards grid */}
      <div className={`grid ${gridClasses} gap-4 md:gap-6 ${getSpacing('md')}`}>
        <StatsCard
          title={applicationsData.title}
          value={applicationsData.value}
          icon={FileText}
          variant="applications"
          trend={applicationsData.trend}
          subtitle={applicationsData.subtitle}
          formatValue={applicationsData.formatValue}
        />

        <StatsCard
          title={interviewsData.title}
          value={interviewsData.value}
          icon={Circle}
          variant="interviews"
          trend={interviewsData.trend}
          subtitle={interviewsData.subtitle}
          formatValue={interviewsData.formatValue}
        />

        <StatsCard
          title={hiredData.title}
          value={hiredData.value}
          icon={Check}
          variant="hired"
          trend={hiredData.trend}
          subtitle={hiredData.subtitle}
          formatValue={hiredData.formatValue}
        />
      </div>

      {/* Last updated timestamp */}
      {response.timestamp && (
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
          Last updated: {new Date(response.timestamp).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default DashboardStats;
