import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { uploadsApi } from '@/lib/api/uploads';
import type {
  ApiResponse,
  Image,
  ImageAttachment,
  EntityType,
  ImageUploadResponse,
} from '@/types/api';

export const uploadKeys = {
  all: ['uploads'] as const,
  images: () => [...uploadKeys.all, 'images'] as const,
  attachments: (entityType: EntityType, entityId: string) =>
    [...uploadKeys.all, 'attachments', entityType, entityId] as const,
};

export const useUploadImage = () => {
  return useMutation({
    mutationFn: async (input: {
      file: File;
      uploader?: string;
    }): Promise<ApiResponse<ImageUploadResponse>> => {
      const fd = new FormData();
      fd.append('image', input.file, input.file.name);
      if (input.uploader) fd.append('uploader', input.uploader);
      // eslint-disable-next-line no-console
      console.log('[useUploadImage] sending upload', {
        name: input.file.name,
        type: input.file.type,
        size: input.file.size,
      });
      const resp = await uploadsApi.uploadImage(fd);
      // eslint-disable-next-line no-console
      console.log('[useUploadImage] upload response', resp);
      return resp;
    },
  });
};

export const useCreateAttachment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      imageExternalId: string;
      entityType: EntityType;
      entityId: string;
      role?: string;
      order?: number;
    }): Promise<ApiResponse<ImageAttachment>> =>
      uploadsApi.createAttachment(payload),
    onSuccess: async (_resp, vars) => {
      await qc.invalidateQueries({
        queryKey: uploadKeys.attachments(vars.entityType, vars.entityId),
      });
    },
  });
};

export const useListAttachments = (
  entityType: EntityType,
  entityId: string
) => {
  return useQuery({
    queryKey: uploadKeys.attachments(entityType, entityId),
    queryFn: async (): Promise<ApiResponse<ImageAttachment[]>> =>
      uploadsApi.listAttachments(entityType, entityId),
    enabled: Boolean(entityType && entityId),
  });
};

export const useDeleteAttachment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      entityType: EntityType;
      entityId: string;
    }): Promise<ApiResponse<any>> => {
      return uploadsApi.deleteAttachment(input.id);
    },
    onSuccess: async (_resp, vars) => {
      await qc.invalidateQueries({
        queryKey: uploadKeys.attachments(vars.entityType, vars.entityId),
      });
    },
  });
};
