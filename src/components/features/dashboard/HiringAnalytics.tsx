import React from 'react';
import { HiringSourcesChart } from '@/components/ui';
import { HiringAnalyticsSkeleton } from '@/components/ui/Skeleton';
import {
  useHiringSourcesRealTime,
  hiringSourcesTransformers,
} from '@/hooks/api';
import { AlertCircle, RefreshCw } from 'lucide-react';

export interface HiringAnalyticsProps {
  className?: string;
  title?: string;
  showLegend?: boolean;
  maxValue?: number;
  enableRealTime?: boolean;
  refreshInterval?: number;
}

const HiringAnalytics: React.FC<HiringAnalyticsProps> = ({
  className,
  title = 'Top Hiring Sources',
  showLegend = true,
  maxValue = 100,
  enableRealTime = true,
  refreshInterval = 300000, // 5 minutes
}) => {
  const { data, isLoading, error, refresh, lastUpdated } =
    useHiringSourcesRealTime({
      enabled: enableRealTime,
      interval: refreshInterval,
    });

  if (isLoading) {
    return (
      <div className={className}>
        <HiringAnalyticsSkeleton />
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className={className}>
        <HiringAnalyticsError title={title} error={error} onRetry={refresh} />
      </div>
    );
  }

  // Handle no data state
  if (!data || !data.sources || data.sources.length === 0) {
    return (
      <div className={className}>
        <HiringAnalyticsEmpty title={title} />
      </div>
    );
  }

  // Transform data for chart
  const chartData = hiringSourcesTransformers.transformForChart(data);

  return (
    <div className={className}>
      <HiringSourcesChart
        data={chartData.sources}
        title={title}
        showLegend={showLegend}
        maxValue={maxValue}
      />

      {/* Last updated indicator */}
      {lastUpdated && (
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span>
            Last updated: {new Date(lastUpdated).toLocaleTimeString()}
          </span>
          <button
            onClick={refresh}
            className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Refresh</span>
          </button>
        </div>
      )}
    </div>
  );
};

// Error state component
const HiringAnalyticsError: React.FC<{
  title: string;
  error: Error;
  onRetry: () => void;
}> = ({ title, error, onRetry }) => {
  return (
    <div className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-900 border border-red-200 dark:border-red-900/50 p-6">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {title}
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Failed to load hiring sources data
        </p>

        <p className="text-xs text-red-600 dark:text-red-400 mb-6 font-mono bg-red-50 dark:bg-red-900/20 p-2 rounded">
          {error.message}
        </p>

        <button
          onClick={onRetry}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Try Again</span>
        </button>
      </div>
    </div>
  );
};

// Empty state component
const HiringAnalyticsEmpty: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
      <div className="text-center py-8">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {title}
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          No hiring sources data available at the moment.
        </p>
      </div>
    </div>
  );
};

export default HiringAnalytics;
