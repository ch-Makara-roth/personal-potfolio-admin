import { ApiResponse } from '@/types/api';
import { baseRequest } from './core';
import {
  getAccessToken,
  getRefreshToken,
  useAuthStore,
  refreshAccessToken,
} from '@/stores/auth-store';

// Helper to check if we need to preflight refresh
function shouldPreflightRefresh(token: string | null): boolean {
  try {
    const s = useAuthStore.getState();
    const expired =
      typeof s.isAccessTokenExpired === 'function'
        ? s.isAccessTokenExpired()
        : false;
    const hasRefresh = Boolean(getRefreshToken());
    const missingAccess = !token && hasRefresh;
    return expired || missingAccess;
  } catch {
    return false;
  }
}

// Helper to build auth headers
function getAuthHeaders(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  // 1. Preflight check
  let token = getAccessToken();
  if (shouldPreflightRefresh(token)) {
    await refreshAccessToken();
    token = getAccessToken();
  }

  // 2. Initial Request
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3111/api'}${endpoint}`;

  try {
    return await baseRequest<T>(url, {
      ...options,
      headers: {
        ...options.headers,
        ...getAuthHeaders(token),
      },
    });
  } catch (error: any) {
    // 3. Handle 401 (Auth Required)
    if (error?.code === 'AUTH_REQUIRED') {
      const refreshed = await refreshAccessToken();
      if (refreshed?.accessToken) {
        // Retry with new token
        return await baseRequest<T>(url, {
          ...options,
          headers: {
            ...options.headers,
            ...getAuthHeaders(refreshed.accessToken),
          },
        });
      }
    }
    throw error;
  }
}

export async function apiUpload<T>(
  endpoint: string,
  formData: FormData,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  // 1. Preflight check
  let token = getAccessToken();
  if (shouldPreflightRefresh(token)) {
    await refreshAccessToken();
    token = getAccessToken();
  }

  // 2. Initial Request
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3111/api'}${endpoint}`;

  try {
    return await baseRequest<T>(url, {
      ...options,
      method: options.method || 'POST',
      body: formData,
      headers: {
        ...options.headers,
        ...getAuthHeaders(token),
        // Do NOT set Content-Type for FormData, browser sets it with boundary
      },
    });
  } catch (error: any) {
    // 3. Handle 401
    if (error?.code === 'AUTH_REQUIRED') {
      const refreshed = await refreshAccessToken();
      if (refreshed?.accessToken) {
        return await baseRequest<T>(url, {
          ...options,
          method: options.method || 'POST',
          body: formData,
          headers: {
            ...options.headers,
            ...getAuthHeaders(refreshed.accessToken),
          },
        });
      }
    }
    throw error;
  }
}

// Re-export types and error class for convenience
export { ApiClientError } from './core';
