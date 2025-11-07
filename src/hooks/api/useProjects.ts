'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import type {
  Project,
  ProjectQuery,
  CreateProjectRequest,
  UpdateProjectRequest,
  ApiResponse,
} from '@/types/api';

// Query keys for projects
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (query?: ProjectQuery) => [...projectKeys.lists(), query] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
};

// List projects with optional filters and pagination
export const useProjects = (query?: ProjectQuery) => {
  return useQuery({
    queryKey: projectKeys.list(query),
    queryFn: async (): Promise<ApiResponse<Project[]>> =>
      projectsApi.getProjects(query),
    staleTime: 2 * 60 * 1000,
  });
};

// Convenience hook to fetch current user's projects
export const useMyProjects = (extra?: Omit<ProjectQuery, 'ownerId'>) => {
  const userId = useAuthStore((s) => s.user?.id);
  const query: ProjectQuery | undefined = userId
    ? { ...(extra || {}), ownerId: userId }
    : undefined;
  return useProjects(query);
};

// Get single project by id or slug
export const useProject = (idOrSlug: string) => {
  return useQuery({
    queryKey: projectKeys.detail(idOrSlug),
    queryFn: async (): Promise<ApiResponse<Project>> =>
      projectsApi.getProject(idOrSlug),
    enabled: Boolean(idOrSlug),
  });
};

// Create project
export const useCreateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      data: CreateProjectRequest
    ): Promise<ApiResponse<Project>> => projectsApi.createProject(data),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
};

// Update project
export const useUpdateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateProjectRequest;
    }): Promise<ApiResponse<Project>> => projectsApi.updateProject(id, data),
    onSuccess: async (resp, variables) => {
      // Update detail cache and invalidate lists
      qc.setQueryData(projectKeys.detail(variables.id), resp);
      await qc.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
};

// Delete project
export const useDeleteProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => projectsApi.deleteProject(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
};
