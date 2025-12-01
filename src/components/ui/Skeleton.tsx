import React from 'react';
import { cn } from '@/utils/cn';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200 dark:bg-gray-700 rounded',
        className
      )}
      aria-hidden="true"
    />
  );
};

export const StatsCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-8 w-16 mb-2" />
        </div>
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
    </div>
  );
};

export const HiringAnalyticsSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
      <Skeleton className="h-6 w-48 mb-6" />
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-8 w-5/6" />
      </div>
      <div className="flex gap-4 mt-6">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
};

export const UpgradeCardSkeleton: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
      <div className="flex items-start gap-4">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-full mb-4" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export const JobsTableSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-800">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
};
