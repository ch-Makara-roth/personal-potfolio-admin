import { apiRequest } from './client';

export const adminCommentsApi = {
  getComments: async (
    query?: import('@/types/api').CommentQuery
  ): Promise<
    import('@/types/api').ApiResponse<import('@/types/api').Comment[]>
  > => {
    const params = new URLSearchParams();
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));
    if (query?.status) params.set('status', query.status);
    if (query?.postId) params.set('postId', query.postId);
    if (query?.authorEmail) params.set('authorEmail', query.authorEmail);
    if (query?.search) params.set('search', query.search);
    if (query?.sortBy) params.set('sortBy', query.sortBy);
    if (query?.sortOrder) params.set('sortOrder', query.sortOrder);
    const qs = params.toString();
    return apiRequest(`/v1/blog/admin/comments${qs ? `?${qs}` : ''}`);
  },
  updateComment: async (
    id: string,
    body: Partial<import('@/types/api').Comment>
  ): Promise<
    import('@/types/api').ApiResponse<import('@/types/api').Comment>
  > => {
    return apiRequest(`/v1/blog/admin/comments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },
  deleteComment: async (
    id: string
  ): Promise<import('@/types/api').ApiResponse<void>> => {
    return apiRequest(`/v1/blog/admin/comments/${id}`, { method: 'DELETE' });
  },
};
