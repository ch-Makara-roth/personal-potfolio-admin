import React from 'react';
import { FileText, Circle, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { StatsCard } from '@/components/ui';
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

// Loading skeleton component
const StatsCardSkeleton = () => (
  <div className="animate-pulse">
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-gray-200 rounded-lg"></div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </div>
      <div className="mb-4">
        <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
      </div>
      <div className="h-8 bg-gray-200 rounded w-full"></div>
    </div>
  </div>
);

// Error component
interface ErrorDisplayProps {
  error: Error;
  onRetry: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry }) => (
  <div className="bg-white rounded-xl border border-red-200 p-6">
    <div className="flex items-center space-x-3 mb-4">
      <div className="bg-red-100 text-red-600 rounded-lg p-2">
        <AlertCircle className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-900">
          Error Loading Statistics
        </h3>
        <p className="text-xs text-gray-500">{error.message}</p>
      </div>
    </div>
    <button
      onClick={onRetry}
      className="inline-flex items-center space-x-2 text-sm text-red-600 hover:text-red-700 font-medium"
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
        <p className="text-gray-500">No statistics data available</p>
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
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">
            Dashboard Statistics
          </h2>
          <button
            onClick={handleRefresh}
            disabled={isRefetching}
            className={`inline-flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
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
        <div className="mt-4 text-xs text-gray-500 text-center">
          Last updated: {new Date(response.timestamp).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default DashboardStats;
