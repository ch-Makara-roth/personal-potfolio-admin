'use client';

import React from 'react';
import { AppLayout } from '@/components/layout';
import {
  StatsCardSkeleton,
  HiringAnalyticsSkeleton,
  UpgradeCardSkeleton,
  Skeleton,
} from '@/components/ui';

export default function DashboardLoading() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header Skeleton */}
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>

        {/* Statistics Cards Skeleton - Full Width */}
        <section aria-label="Loading dashboard statistics">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </div>
        </section>

        {/* Two Column Layout for Calendar/Interviews and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Calendar and Upcoming Interviews Skeleton */}
          <div className="lg:col-span-1 space-y-6">
            {/* Calendar Widget Skeleton */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-6 w-32" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {[...Array(35)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-8 rounded" />
                ))}
              </div>
            </div>

            {/* Upcoming Interviews Skeleton */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <Skeleton className="h-6 w-48 mb-4" />
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Hiring Analytics Chart Skeleton */}
          <div className="lg:col-span-2">
            <HiringAnalyticsSkeleton />
          </div>
        </div>

        {/* Jobs Table Skeleton - Full Width */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="divide-y divide-gray-200">
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

        {/* Upgrade Card Skeleton - Full Width */}
        <UpgradeCardSkeleton />
      </div>
    </AppLayout>
  );
}
