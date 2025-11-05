'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminBlogApi } from '@/lib/api';
import type { BlogPost, BlogPostQuery, ApiResponse } from '@/types/api';

export const useAdminBlogPosts = (query?: BlogPostQuery) => {
  return useQuery({
    queryKey: ['admin', 'blog', 'posts', query],
    queryFn: async () => adminBlogApi.getPosts(query),
  });
};

export const useAdminBlogPost = (id: string) => {
  return useQuery({
    queryKey: ['admin', 'blog', 'post', id],
    queryFn: async () => adminBlogApi.getPost(id),
    enabled: Boolean(id),
  });
};

export const useCreateBlogPost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<BlogPost>) => adminBlogApi.createPost(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'blog', 'posts'] });
    },
  });
};

export const useUpdateBlogPost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BlogPost> }) =>
      adminBlogApi.updatePost(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'blog', 'posts'] });
    },
  });
};

export const useDeleteBlogPost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminBlogApi.deletePost(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'blog', 'posts'] });
    },
  });
};
