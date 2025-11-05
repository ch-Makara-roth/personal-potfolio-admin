'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminCommentsApi } from '@/lib/api';
import type { Comment, CommentQuery } from '@/types/api';

export const useAdminComments = (
  query?: CommentQuery,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ['admin', 'comments', query],
    queryFn: async () => adminCommentsApi.getComments(query),
    enabled: options?.enabled ?? true,
  });
};

export const useUpdateComment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Comment> }) =>
      adminCommentsApi.updateComment(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'comments'] });
    },
  });
};

export const useDeleteComment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminCommentsApi.deleteComment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'comments'] });
    },
  });
};
