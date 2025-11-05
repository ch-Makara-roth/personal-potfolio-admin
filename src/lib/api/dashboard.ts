import { apiRequest } from './client';
import type { DashboardStats, ApiResponse } from '@/types/api';

export const dashboardApi = {
  getStats: async (): Promise<ApiResponse<DashboardStats>> => {
    return apiRequest<DashboardStats>('/dashboard/stats');
  },
  getStatByType: async (
    type: 'applications' | 'interviews' | 'hired'
  ): Promise<ApiResponse<any>> => {
    return apiRequest(`/dashboard/stats/${type}`);
  },
};
