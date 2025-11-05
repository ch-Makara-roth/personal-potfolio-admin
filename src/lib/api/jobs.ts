import { apiRequest } from './client';

export const jobsApi = {
  getJobs: async (params?: {
    page?: number;
    limit?: number;
    sort?: string;
    direction?: 'asc' | 'desc';
    status?: string[];
    search?: string;
  }): Promise<
    import('@/types/api').ApiResponse<import('@/types/api').Job[]>
  > => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.sort) searchParams.set('sort', params.sort);
    if (params?.direction) searchParams.set('direction', params.direction);
    if (params?.status?.length)
      searchParams.set('status', params.status.join(','));
    if (params?.search) searchParams.set('search', params.search);

    const query = searchParams.toString();
    return apiRequest<import('@/types/api').Job[]>(
      `/jobs${query ? `?${query}` : ''}`
    );
  },
  getJob: async (
    id: string
  ): Promise<import('@/types/api').ApiResponse<import('@/types/api').Job>> => {
    return apiRequest<import('@/types/api').Job>(`/jobs/${id}`);
  },
  createJob: async (
    jobData: Partial<import('@/types/api').Job>
  ): Promise<import('@/types/api').ApiResponse<import('@/types/api').Job>> => {
    return apiRequest<import('@/types/api').Job>('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  },
  updateJob: async (
    id: string,
    jobData: Partial<import('@/types/api').Job>
  ): Promise<import('@/types/api').ApiResponse<import('@/types/api').Job>> => {
    return apiRequest<import('@/types/api').Job>(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(jobData),
    });
  },
  updateJobStatus: async (
    id: string,
    status: import('@/types/api').Job['status']
  ): Promise<import('@/types/api').ApiResponse<import('@/types/api').Job>> => {
    return apiRequest<import('@/types/api').Job>(`/jobs/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
  deleteJob: async (
    id: string
  ): Promise<import('@/types/api').ApiResponse<void>> => {
    return apiRequest<void>(`/jobs/${id}`, {
      method: 'DELETE',
    });
  },
  duplicateJob: async (
    id: string
  ): Promise<import('@/types/api').ApiResponse<import('@/types/api').Job>> => {
    return apiRequest<import('@/types/api').Job>(`/jobs/${id}/duplicate`, {
      method: 'POST',
    });
  },
};
