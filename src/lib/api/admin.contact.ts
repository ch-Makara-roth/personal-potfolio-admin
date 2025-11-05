import { apiRequest } from './client';

export const adminContactApi = {
  getContacts: async (
    query?: import('@/types/api').ContactQuery
  ): Promise<
    import('@/types/api').ApiResponse<import('@/types/api').ContactMessage[]>
  > => {
    const params = new URLSearchParams();
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));
    if (query?.status) params.set('status', query.status);
    if (query?.search) params.set('search', query.search);
    if (query?.sortBy) params.set('sortBy', query.sortBy);
    if (query?.sortOrder) params.set('sortOrder', query.sortOrder);
    if (query?.dateFrom) params.set('dateFrom', query.dateFrom);
    if (query?.dateTo) params.set('dateTo', query.dateTo);
    const qs = params.toString();
    return apiRequest(`/v1/contact/admin${qs ? `?${qs}` : ''}`);
  },
  getContact: async (
    id: string
  ): Promise<
    import('@/types/api').ApiResponse<import('@/types/api').ContactMessage>
  > => {
    return apiRequest(`/v1/contact/admin/${id}`);
  },
  getStats: async (): Promise<import('@/types/api').ApiResponse<any>> => {
    return apiRequest(`/v1/contact/admin/stats`);
  },
  updateContact: async (
    id: string,
    body: Partial<import('@/types/api').ContactMessage>
  ): Promise<
    import('@/types/api').ApiResponse<import('@/types/api').ContactMessage>
  > => {
    return apiRequest(`/v1/contact/admin/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },
  deleteContact: async (
    id: string
  ): Promise<import('@/types/api').ApiResponse<void>> => {
    return apiRequest(`/v1/contact/admin/${id}`, { method: 'DELETE' });
  },
  markRead: async (
    id: string
  ): Promise<import('@/types/api').ApiResponse<void>> => {
    return apiRequest(`/v1/contact/admin/${id}/read`, { method: 'PATCH' });
  },
  markReplied: async (
    id: string,
    notes?: string
  ): Promise<import('@/types/api').ApiResponse<void>> => {
    return apiRequest(`/v1/contact/admin/${id}/replied`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    });
  },
  archive: async (
    id: string
  ): Promise<import('@/types/api').ApiResponse<void>> => {
    return apiRequest(`/v1/contact/admin/${id}/archive`, { method: 'PATCH' });
  },
};
