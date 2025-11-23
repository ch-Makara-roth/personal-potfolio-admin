import { AuthTokens } from '@/types/api';
import { baseRequest, API_BASE_URL, API_VERSION } from './core';

export async function refreshSession(
  refreshToken?: string | null
): Promise<AuthTokens | null> {
  try {
    const refreshUrl = `${API_BASE_URL}/${API_VERSION}/auth/refresh`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(refreshToken ? { Authorization: `Bearer ${refreshToken}` } : {}),
    };

    const response = await baseRequest<{ tokens: AuthTokens }>(refreshUrl, {
      method: 'POST',
      headers,
      body: refreshToken ? JSON.stringify({ refreshToken }) : undefined,
    });

    if (response.status === 'success' && response.data?.tokens) {
      return response.data.tokens;
    }

    return null;
  } catch (error) {
    // If refresh fails (e.g. 401, network error), return null
    // The caller (auth-store or client) will handle the logout/redirect
    return null;
  }
}
