import { ApiResponse, ApiError } from '@/types/api';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
export const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1';
export const API_TIMEOUT = 10000; // 10 seconds

export class ApiClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public status?: number,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

// Normalize server responses that use `{ success: boolean, data, message? }`
export function normalizeApiResponse<T>(raw: any): ApiResponse<T> {
  if (raw && typeof raw === 'object') {
    if ('success' in raw) {
      return {
        data: raw.data as T,
        status: raw.success ? 'success' : 'error',
        message: raw.message || undefined,
        timestamp: raw.timestamp || new Date().toISOString(),
      };
    }
    if ('data' in raw && 'status' in raw && 'timestamp' in raw) {
      return raw as ApiResponse<T>;
    }
    // Fallback: wrap raw into our ApiResponse
    return {
      data: (raw?.data ?? raw) as T,
      status: 'success',
      message: raw?.message,
      timestamp: new Date().toISOString(),
    };
  }
  return {
    // If raw isn't an object, just wrap it
    data: raw as T,
    status: 'success',
    timestamp: new Date().toISOString(),
  };
}

export async function baseRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  // Only set Content-Type to application/json if body is NOT FormData
  // For FormData, browser will auto-set multipart/form-data with boundary
  const isFormData = options.body instanceof FormData;
  const defaultHeaders: Record<string, string> = isFormData
    ? {}
    : { 'Content-Type': 'application/json' };

  const config: RequestInit = {
    ...options,
    signal: controller.signal,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    // Always include credentials so cookies (e.g., refresh token) are sent
    credentials: 'include',
  };

  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred',
      }));

      throw new ApiClientError(
        errorData.code ||
          (response.status === 401 ? 'AUTH_REQUIRED' : 'SERVER_ERROR'),
        errorData.message ||
          (response.status === 401
            ? 'Authentication required'
            : 'Server error'),
        response.status,
        (errorData as any).details ?? (errorData as any).data
      );
    }

    const raw = await response.json();
    return normalizeApiResponse<T>(raw);
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiClientError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiClientError('TIMEOUT', 'Request timeout');
      }
      throw new ApiClientError('NETWORK_ERROR', error.message);
    }

    throw new ApiClientError('UNKNOWN_ERROR', 'An unknown error occurred');
  }
}
