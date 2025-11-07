import { ApiResponse, ApiError, AuthTokens } from '@/types/api';
import {
  getAccessToken,
  getRefreshToken,
  useAuthStore,
} from '@/stores/auth-store';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  // 'http://localhost:3111/api';
  'https://api.chhuonmakararoth.site/api';
// API version for REST endpoints (default v1). Configure via NEXT_PUBLIC_API_VERSION
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1';
const API_TIMEOUT = 10000; // 10 seconds

// Guard to avoid multiple redirects to login
let isRedirectingToLogin = false;
function redirectToLogin() {
  if (typeof window !== 'undefined' && !isRedirectingToLogin) {
    isRedirectingToLogin = true;
    // Small delay to allow store updates to flush
    setTimeout(() => {
      // Use replace so user can't navigate back to the protected page with browser back
      window.location.replace('/login');
    }, 0);
  }
}

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

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
  } as Record<string, string>;

  const token = getAccessToken();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  const headers: HeadersInit = {
    ...defaultHeaders,
    ...authHeader,
    ...(options.headers as any),
  };

  const config: RequestInit = {
    ...options,
    headers,
    // Always include credentials so cookies (e.g., refresh token) are sent
    credentials: 'include',
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
  config.signal = controller.signal;

  try {
    let response = await fetch(url, config);
    clearTimeout(timeoutId);

    // If unauthorized, attempt to refresh token once and retry
    if (response.status === 401) {
      const refreshed = await refreshAccessToken();
      if (refreshed?.accessToken) {
        // Retry original request with new token
        const newToken = getAccessToken();
        const retryHeaders: HeadersInit = {
          ...defaultHeaders,
          ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
          ...(options.headers as any),
        };
        const retryConfig: RequestInit = {
          ...options,
          headers: retryHeaders,
          credentials: 'include',
        };
        response = await fetch(url, retryConfig);
      }
    }

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
        errorData.details
      );
    }

    const raw = await response.json();
    const data: ApiResponse<T> = normalizeApiResponse<T>(raw);
    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiClientError) {
      throw error;
    }

    if (error instanceof Error) {
      if ((error as any).name === 'AbortError') {
        throw new ApiClientError('TIMEOUT', 'Request timeout');
      }
      throw new ApiClientError('NETWORK_ERROR', error.message);
    }

    throw new ApiClientError('UNKNOWN_ERROR', 'An unknown error occurred');
  }
}

// Normalize server responses that use `{ success: boolean, data, message? }`
function normalizeApiResponse<T>(raw: any): ApiResponse<T> {
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

// Attempt to refresh the access token using refresh token from cookie or storage
let refreshInFlight: Promise<AuthTokens | null> | null = null;
async function refreshAccessToken(): Promise<AuthTokens | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refreshToken = getRefreshToken();
      try {
        // Refresh endpoint (e.g., /api/v1/auth/refresh). Server reads refresh token
        // from cookies or Authorization header. We should attempt refresh even if
        // we don't have a refresh token in local storage, because many backends
        // store the refresh token in an HttpOnly cookie.
        const refreshUrl = `${API_BASE_URL}/${API_VERSION}/auth/refresh`;

        // Build headers conditionally. If we have a refresh token stored, also send it
        // in the Authorization header to maximize compatibility with different backends.
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          ...(refreshToken ? { Authorization: `Bearer ${refreshToken}` } : {}),
        };

        const resp = await fetch(refreshUrl, {
          method: 'POST',
          headers,
          // If we have a refresh token available, include it in the request body.
          // Otherwise, rely on HttpOnly cookies via `credentials: 'include'`.
          body: refreshToken ? JSON.stringify({ refreshToken }) : undefined,
          credentials: 'include',
        });

        if (!resp.ok) {
          // Clear session on failed refresh and redirect to login
          useAuthStore.getState().clearSession();
          redirectToLogin();
          return null;
        }

        const raw = await resp.json();
        const normalized = normalizeApiResponse<AuthTokens>(raw);
        const tokens = normalized.data;
        if (tokens?.accessToken) {
          const { updateTokens } = useAuthStore.getState();
          updateTokens(tokens);
          return tokens;
        }
        // If server responded with success: false or provided an explicit validation error,
        // clear session and redirect to login.
        if (normalized.status === 'error' || raw?.code === 'VALIDATION_ERROR') {
          useAuthStore.getState().clearSession();
          redirectToLogin();
        }
        return null;
      } catch (e) {
        // Network or parsing error: do not force logout here to avoid
        // signing the user out due to transient network issues.
        return null;
      } finally {
        // Reset in-flight promise after completion
        setTimeout(() => {
          refreshInFlight = null;
        }, 0);
      }
    })();
  }
  return refreshInFlight;
}
