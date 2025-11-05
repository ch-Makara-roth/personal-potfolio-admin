'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import JobsTable from '@/components/features/jobs/JobsTable';
import { useJobs, useJobActions } from '@/hooks/api/useJobs';
import type { JobSortField, SortDirection } from '@/types/api';

// Create a query client for this demo
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const JobsTableDemo: React.FC = () => {
  const [page, setPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    field: JobSortField;
    direction: SortDirection;
  }>({
    field: 'datePosted',
    direction: 'desc',
  });

  const { data, isLoading, error } = useJobs({
    page,
    limit: 10,
    sort: sortConfig.field,
    direction: sortConfig.direction,
  });

  const { handleJobAction, isLoading: isActionLoading } = useJobActions();

  const handleSort = (field: string) => {
    setSortConfig((prev) => ({
      field: field as JobSortField,
      direction:
        prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Error Loading Jobs
          </h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Jobs Management
          </h1>
          <p className="text-gray-600">
            Manage your job postings, track applications, and monitor hiring
            progress.
          </p>
        </div>

        <div className="space-y-6">
          <JobsTable
            jobs={data?.data || []}
            loading={isLoading || isActionLoading}
            sortConfig={sortConfig}
            onSort={handleSort}
            onJobAction={handleJobAction}
            pagination={data?.pagination}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
};

const JobsTablePage: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <JobsTableDemo />
    </QueryClientProvider>
  );
};

export default JobsTablePage;
