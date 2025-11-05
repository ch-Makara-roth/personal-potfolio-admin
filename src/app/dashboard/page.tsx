'use client';

import React, { useState, Suspense, lazy } from 'react';
import { AppLayout } from '@/components/layout';
import { AuthGuard } from '@/components/providers/AuthGuard';
import { DashboardStats } from '@/components/features/dashboard';
import { JobsTable } from '@/components/features/jobs';
import { CalendarWidget } from '@/components/ui/CalendarWidget';
import { UpcomingInterviews } from '@/components/ui/UpcomingInterviews';
import { HiringAnalyticsSkeleton, UpgradeCardSkeleton } from '@/components/ui';
import { useCalendarNavigation } from '@/hooks/useCalendarNavigation';
import { useInterviewManagement } from '@/hooks/useInterviewManagement';
import { useJobs, useJobActions } from '@/hooks/api/useJobs';
import type { JobSortField, SortDirection } from '@/types/api';

// Lazy load non-critical components for better initial page load performance
const HiringAnalytics = lazy(() =>
  import('@/components/features/dashboard').then((mod) => ({
    default: mod.HiringAnalytics,
  }))
);

const UpgradeCard = lazy(() =>
  import('@/components/ui/UpgradeCard').then((mod) => ({
    default: mod.UpgradeCard,
  }))
);

export default function DashboardPage() {
  // Jobs state management
  const [sortConfig, setSortConfig] = useState<{
    field: JobSortField;
    direction: SortDirection;
  }>({
    field: 'datePosted',
    direction: 'desc',
  });

  // Fetch jobs data
  const { data: jobsData, isLoading: jobsLoading } = useJobs({
    page: 1,
    limit: 10,
    sort: sortConfig.field,
    direction: sortConfig.direction,
  });

  // Job actions handler
  const { handleJobAction } = useJobActions();

  // Calendar state management
  const {
    currentDate,
    events,
    goToPreviousMonth,
    goToNextMonth,
    selectDate,
    setCurrentDate,
  } = useCalendarNavigation();

  // Interview management
  const { displayedInterviews } = useInterviewManagement();

  // Calendar month change handler
  const handleMonthChange = (date: Date) => {
    setCurrentDate(date);
  };

  // Calendar date click handler
  const handleDateClick = (date: Date) => {
    selectDate(date);
  };

  // Jobs sort handler
  const handleSort = (field: string) => {
    setSortConfig((prev) => ({
      field: field as JobSortField,
      direction:
        prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  return (
    <AppLayout>
      <AuthGuard />
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Welcome to your CONSULT hiring analytics dashboard
          </p>
        </div>

        {/* Statistics Cards - Full Width */}
        <section aria-label="Dashboard statistics">
          <DashboardStats />
        </section>

        {/* Two Column Layout for Calendar/Interviews and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Calendar and Upcoming Interviews */}
          <div className="lg:col-span-1 space-y-6">
            {/* Calendar Widget */}
            <section aria-label="Calendar">
              <CalendarWidget
                currentDate={currentDate}
                events={events}
                onMonthChange={handleMonthChange}
                onDateClick={handleDateClick}
                size="full"
              />
            </section>

            {/* Upcoming Interviews */}
            <section aria-label="Upcoming interviews">
              <UpcomingInterviews
                interviews={displayedInterviews}
                maxVisible={5}
                size="default"
              />
            </section>
          </div>

          {/* Right Column: Hiring Analytics Chart */}
          <div className="lg:col-span-2">
            <section aria-label="Hiring analytics">
              <Suspense fallback={<HiringAnalyticsSkeleton />}>
                <HiringAnalytics />
              </Suspense>
            </section>
          </div>
        </div>

        {/* Jobs Table - Full Width */}
        <section aria-label="Current job openings">
          <JobsTable
            jobs={jobsData?.data || []}
            loading={jobsLoading}
            sortConfig={sortConfig}
            onSort={handleSort}
            onJobAction={handleJobAction}
          />
        </section>

        {/* Upgrade Card - Full Width */}
        <section aria-label="Upgrade promotion">
          <Suspense fallback={<UpgradeCardSkeleton />}>
            <UpgradeCard
              dismissible={true}
              storageKey="dashboard-upgrade-card-dismissed"
              source="dashboard_card"
            />
          </Suspense>
        </section>
      </div>
    </AppLayout>
  );
}
