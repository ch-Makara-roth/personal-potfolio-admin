import { apiRequest, apiUpload } from './client';
import type {
  ApiResponse,
  Image,
  ImageUploadResponse,
  ImageQuery,
  ImageAttachment,
  EntityType,
} from '@/types/api';

const apiVersion = process.env.NEXT_PUBLIC_API_VERSION || 'v1';

export const uploadsApi = {
  uploadImage: async (
    fd: FormData
  ): Promise<ApiResponse<ImageUploadResponse>> => {
    const image = fd.get('image');
    if (!image) {
      // eslint-disable-next-line no-console
      console.error('[uploadsApi] missing image in FormData');
      throw new Error('IMAGE_REQUIRED');
    }
    // eslint-disable-next-line no-console
    console.log('[uploadsApi] uploading image', image);
    const triedVersions: string[] = [];
    const versions = Array.from(new Set([apiVersion, 'v9', 'v1']));
    let lastError: any = null;
    for (const v of versions) {
      triedVersions.push(v);
      try {
        const resp = await apiUpload<ImageUploadResponse>(
          `/${v}/uploads/images`,
          fd
        );
        // eslint-disable-next-line no-console
        console.log('[uploadsApi] upload result', resp);
        return resp;
      } catch (e: any) {
        lastError = e;
        // Retry on 404 or path-related errors only; otherwise break
        const status = e?.status;
        const code = e?.code;
        if (status === 404 || code === 'NOT_FOUND') {
          continue;
        }
        break;
      }
    }
    // eslint-disable-next-line no-console
    console.error('[uploadsApi] upload failed across versions', {
      triedVersions,
      error: lastError,
    });
    throw lastError || new Error('UPLOAD_FAILED');
  },

  listImages: async (query?: ImageQuery): Promise<ApiResponse<Image[]>> => {
    const params = new URLSearchParams();
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));
    if (query?.uploader) params.set('uploader', query.uploader);
    if (query?.format) params.set('format', query.format);
    if (query?.mimetype) params.set('mimetype', query.mimetype);
    const qs = params.toString();
    const endpoint = qs
      ? `/${apiVersion}/uploads/images?${qs}`
      : `/${apiVersion}/uploads/images`;
    return apiRequest<Image[]>(endpoint);
  },

  deleteImage: async (externalId: string): Promise<ApiResponse<any>> => {
    return apiRequest<any>(
      `/${apiVersion}/uploads/images/${encodeURIComponent(externalId)}`,
      {
        method: 'DELETE',
      }
    );
  },

  createAttachment: async (payload: {
    imageExternalId: string;
    entityType: EntityType;
    entityId: string;
    role?: string;
    order?: number;
  }): Promise<ApiResponse<ImageAttachment>> => {
    const triedVersions: string[] = [];
    const versions = Array.from(new Set([apiVersion, 'v9', 'v1']));
    let lastError: any = null;
    for (const v of versions) {
      triedVersions.push(v);
      try {
        return await apiRequest<ImageAttachment>(`/${v}/uploads/attachments`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } catch (e: any) {
        lastError = e;
        const status = e?.status;
        const code = e?.code;
        if (status === 404 || code === 'NOT_FOUND') {
          continue;
        }
        break;
      }
    }
    // eslint-disable-next-line no-console
    console.error('[uploadsApi] createAttachment failed across versions', {
      triedVersions,
      error: lastError,
    });
    throw lastError || new Error('ATTACHMENT_FAILED');
  },

  listAttachments: async (
    entityType: EntityType,
    entityId: string
  ): Promise<ApiResponse<ImageAttachment[]>> => {
    const params = new URLSearchParams();
    params.set('entityType', entityType);
    params.set('entityId', entityId);
    return apiRequest<ImageAttachment[]>(
      `/${apiVersion}/uploads/attachments?${params.toString()}`
    );
  },

  deleteAttachment: async (id: string): Promise<ApiResponse<any>> => {
    return apiRequest<any>(
      `/${apiVersion}/uploads/attachments/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
      }
    );
  },
};
