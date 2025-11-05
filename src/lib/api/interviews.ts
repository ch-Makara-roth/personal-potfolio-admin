import { apiRequest } from './client';

export const interviewApi = {
  getUpcoming: async (
    limit?: number
  ): Promise<
    import('@/types/api').ApiResponse<import('@/types/api').Interview[]>
  > => {
    const params = limit ? `?limit=${limit}` : '';
    return apiRequest<import('@/types/api').Interview[]>(
      `/interviews/upcoming${params}`
    );
  },
  getByDate: async (
    date: string
  ): Promise<
    import('@/types/api').ApiResponse<import('@/types/api').Interview[]>
  > => {
    return apiRequest<import('@/types/api').Interview[]>(
      `/interviews?date=${date}`
    );
  },
};
