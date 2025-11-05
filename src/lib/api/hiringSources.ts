import { apiRequest } from './client';

export const hiringSourcesApi = {
  getHiringSources: async (): Promise<
    import('@/types/api').ApiResponse<import('@/types/api').HiringSourcesData>
  > => {
    return apiRequest<import('@/types/api').HiringSourcesData>(
      '/analytics/hiring-sources'
    );
  },
  getHiringSourcesByCategory: async (
    category: 'design' | 'engineering' | 'marketing'
  ): Promise<
    import('@/types/api').ApiResponse<import('@/types/api').HiringSource[]>
  > => {
    return apiRequest<import('@/types/api').HiringSource[]>(
      `/analytics/hiring-sources?category=${category}`
    );
  },
};
