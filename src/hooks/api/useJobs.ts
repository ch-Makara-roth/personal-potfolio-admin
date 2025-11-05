import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  jobsApi,
  getMockJobs,
  getMockJob,
  updateMockJobStatus,
  deleteMockJob,
  duplicateMockJob,
} from '@/lib/api';
import type {
  Job,
  JobsListResponse,
  JobSortField,
  SortDirection,
} from '@/types/api';

// Query keys
export const jobsKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobsKeys.all, 'list'] as const,
  list: (params: any) => [...jobsKeys.lists(), params] as const,
  details: () => [...jobsKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobsKeys.details(), id] as const,
};

// Hook for fetching jobs with pagination and filtering
export const useJobs = (params?: {
  page?: number;
  limit?: number;
  sort?: JobSortField;
  direction?: SortDirection;
  status?: Job['status'][];
  search?: string;
}) => {
  return useQuery({
    queryKey: jobsKeys.list(params),
    queryFn: () => {
      // Use mock data for development
      return getMockJobs(params);
      // For production, use: return jobsApi.getJobs(params);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for fetching a single job
export const useJob = (id: string) => {
  return useQuery({
    queryKey: jobsKeys.detail(id),
    queryFn: () => {
      // Use mock data for development
      return getMockJob(id);
      // For production, use: return jobsApi.getJob(id);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for creating a new job
export const useCreateJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobData: Partial<Job>) => {
      // For production, use: return jobsApi.createJob(jobData);
      throw new Error('Create job not implemented in mock');
    },
    onSuccess: () => {
      // Invalidate and refetch jobs list
      queryClient.invalidateQueries({ queryKey: jobsKeys.lists() });
    },
  });
};

// Hook for updating a job
export const useUpdateJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, jobData }: { id: string; jobData: Partial<Job> }) => {
      // For production, use: return jobsApi.updateJob(id, jobData);
      throw new Error('Update job not implemented in mock');
    },
    onSuccess: (data, variables) => {
      // Update the job in cache
      queryClient.setQueryData(jobsKeys.detail(variables.id), data);
      // Invalidate jobs list to refresh
      queryClient.invalidateQueries({ queryKey: jobsKeys.lists() });
    },
  });
};

// Hook for updating job status with optimistic updates
export const useUpdateJobStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Job['status'] }) => {
      // Use mock data for development
      return updateMockJobStatus(id, status);
      // For production, use: return jobsApi.updateJobStatus(id, status);
    },
    onMutate: async ({ id, status }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: jobsKeys.lists() });
      await queryClient.cancelQueries({ queryKey: jobsKeys.detail(id) });

      // Snapshot the previous values
      const previousJobsQueries = queryClient.getQueriesData({
        queryKey: jobsKeys.lists(),
      });
      const previousJob = queryClient.getQueryData(jobsKeys.detail(id));

      // Optimistically update jobs in all list queries
      queryClient.setQueriesData({ queryKey: jobsKeys.lists() }, (old: any) => {
        if (!old?.data) return old;

        return {
          ...old,
          data: old.data.map((job: Job) =>
            job.id === id
              ? { ...job, status, updatedAt: new Date().toISOString() }
              : job
          ),
        };
      });

      // Optimistically update single job query
      queryClient.setQueryData(jobsKeys.detail(id), (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: { ...old.data, status, updatedAt: new Date().toISOString() },
        };
      });

      return { previousJobsQueries, previousJob };
    },
    onError: (err, variables, context) => {
      // Rollback optimistic updates on error
      if (context?.previousJobsQueries) {
        context.previousJobsQueries.forEach(([queryKey, queryData]) => {
          queryClient.setQueryData(queryKey, queryData);
        });
      }
      if (context?.previousJob) {
        queryClient.setQueryData(
          jobsKeys.detail(variables.id),
          context.previousJob
        );
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: jobsKeys.lists() });
    },
  });
};

// Hook for deleting a job
export const useDeleteJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      // Use mock data for development
      return deleteMockJob(id);
      // For production, use: return jobsApi.deleteJob(id);
    },
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: jobsKeys.lists() });

      // Snapshot the previous values
      const previousJobsQueries = queryClient.getQueriesData({
        queryKey: jobsKeys.lists(),
      });

      // Optimistically remove job from all list queries
      queryClient.setQueriesData({ queryKey: jobsKeys.lists() }, (old: any) => {
        if (!old?.data) return old;

        return {
          ...old,
          data: old.data.filter((job: Job) => job.id !== id),
          pagination: old.pagination
            ? {
                ...old.pagination,
                total: old.pagination.total - 1,
              }
            : undefined,
        };
      });

      return { previousJobsQueries };
    },
    onError: (err, variables, context) => {
      // Rollback optimistic updates on error
      if (context?.previousJobsQueries) {
        context.previousJobsQueries.forEach(([queryKey, queryData]) => {
          queryClient.setQueryData(queryKey, queryData);
        });
      }
    },
    onSuccess: (data, id) => {
      // Remove job detail from cache
      queryClient.removeQueries({ queryKey: jobsKeys.detail(id) });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: jobsKeys.lists() });
    },
  });
};

// Hook for duplicating a job
export const useDuplicateJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      // Use mock data for development
      return duplicateMockJob(id);
      // For production, use: return jobsApi.duplicateJob(id);
    },
    onSuccess: () => {
      // Invalidate and refetch jobs list
      queryClient.invalidateQueries({ queryKey: jobsKeys.lists() });
    },
  });
};

// Combined hook for all job actions
export const useJobActions = () => {
  const updateStatus = useUpdateJobStatus();
  const deleteJob = useDeleteJob();
  const duplicateJob = useDuplicateJob();

  const handleJobAction = async (jobId: string, action: string) => {
    try {
      switch (action) {
        case 'edit':
          // Navigate to edit page or open edit modal
          console.log('Edit job:', jobId);
          break;
        case 'pause':
          await updateStatus.mutateAsync({ id: jobId, status: 'paused' });
          break;
        case 'resume':
          await updateStatus.mutateAsync({ id: jobId, status: 'active' });
          break;
        case 'close':
          await updateStatus.mutateAsync({ id: jobId, status: 'closed' });
          break;
        case 'delete':
          if (
            window.confirm(
              'Are you sure you want to delete this job? This action cannot be undone.'
            )
          ) {
            await deleteJob.mutateAsync(jobId);
          }
          break;
        case 'duplicate':
          await duplicateJob.mutateAsync(jobId);
          break;
        default:
          console.warn('Unknown job action:', action);
      }
    } catch (error) {
      console.error('Job action failed:', error);
      // Error handling is managed by the individual mutation hooks
    }
  };

  return {
    handleJobAction,
    isLoading:
      updateStatus.isPending || deleteJob.isPending || duplicateJob.isPending,
    error: updateStatus.error || deleteJob.error || duplicateJob.error,
  };
};
