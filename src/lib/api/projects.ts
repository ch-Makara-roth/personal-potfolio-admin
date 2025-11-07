import { apiRequest, ApiClientError } from './client';
import type {
  Project,
  ProjectQuery,
  ApiResponse,
  CreateProjectRequest,
  UpdateProjectRequest,
} from '@/types/api';

// Public/Authenticated Projects API
export const projectsApi = {
  async getProjects(query?: ProjectQuery): Promise<ApiResponse<Project[]>> {
    const params = new URLSearchParams();
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));
    if (query?.status) params.set('status', query.status);
    if (query?.ownerId) params.set('ownerId', query.ownerId);
    if (query?.technologies?.length)
      params.set('technologies', query.technologies.join(','));
    if (query?.search) params.set('search', query.search);
    if (typeof query?.featured === 'boolean')
      params.set('featured', String(query.featured));
    if (query?.sortBy) params.set('sortBy', query.sortBy);
    if (query?.sortOrder) params.set('sortOrder', query.sortOrder);

    const qs = params.toString();
    return apiRequest<Project[]>(`/v1/projects${qs ? `?${qs}` : ''}`);
  },

  async getProject(idOrSlug: string): Promise<ApiResponse<Project>> {
    if (!idOrSlug) throw new ApiClientError('VALIDATION_ERROR', 'Missing id');
    return apiRequest<Project>(`/v1/projects/${idOrSlug}`);
  },

  async createProject(
    body: CreateProjectRequest
  ): Promise<ApiResponse<Project>> {
    if (!body?.title || !body?.description || !body?.technologies?.length) {
      throw new ApiClientError(
        'VALIDATION_ERROR',
        'title, description, and at least 1 technology are required',
        400
      );
    }
    // Optional client-side SEO length hints
    if (body.metaTitle && body.metaTitle.length > 60) {
      throw new ApiClientError(
        'VALIDATION_ERROR',
        'metaTitle max 60 chars',
        400
      );
    }
    if (body.metaDescription && body.metaDescription.length > 160) {
      throw new ApiClientError(
        'VALIDATION_ERROR',
        'metaDescription max 160 chars',
        400
      );
    }
    return apiRequest<Project>(`/v1/projects`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async updateProject(
    id: string,
    body: UpdateProjectRequest
  ): Promise<ApiResponse<Project>> {
    if (!id) throw new ApiClientError('VALIDATION_ERROR', 'Missing id');
    return apiRequest<Project>(`/v1/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  async deleteProject(id: string): Promise<ApiResponse<{ id: string }>> {
    if (!id) throw new ApiClientError('VALIDATION_ERROR', 'Missing id');
    return apiRequest<{ id: string }>(`/v1/projects/${id}`, {
      method: 'DELETE',
    });
  },
};
