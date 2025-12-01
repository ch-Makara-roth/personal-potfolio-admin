import { apiRequest } from '@/lib/api/client';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://api.chhuonmakararoth.site/api';

describe('API client authentication', () => {
  beforeEach(() => {
    jest.resetModules();
    (global as any).fetch = jest.fn();
  });

  it('preflights refresh when token missing and proceeds with successful request', async () => {
    // Preflight refresh: success
    (global as any).fetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            tokens: { accessToken: 'new.jwt.token', refreshToken: 'rt' },
          },
        }),
      })
      // First actual request: success
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { hello: 'world' } }),
      });

    // Mock auth-store: no token prior to request, expired state forces preflight
    jest.doMock('@/stores/auth-store', () => {
      const original = jest.requireActual('@/stores/auth-store');
      return {
        ...original,
        getAccessToken: () => null,
        getRefreshToken: () => null,
        useAuthStore: {
          getState: () => ({
            isAccessTokenExpired: () => true,
            updateTokens: jest.fn(),
            clearSession: jest.fn(),
          }),
        },
      };
    });

    const { apiRequest: api } = await import('@/lib/api/client');
    const res = await api<{ hello: string }>(`/test`, { method: 'GET' });
    expect(res.status).toBe('success');
    expect((res as any).data?.hello).toBe('world');
    // Ensure preflight refresh endpoint was called
    const calls = (global as any).fetch.mock.calls.map((c: any[]) =>
      String(c[0])
    );
    expect(calls[0]).toContain('/auth/refresh');
  });

  it('only performs one refresh when multiple requests get 401 concurrently', async () => {
    // First request: 401 for both
    (global as any).fetch
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ code: 'AUTH_REQUIRED' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ code: 'AUTH_REQUIRED' }),
      })
      // Single refresh call
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            tokens: { accessToken: 'new.jwt.token', refreshToken: 'rt' },
          },
        }),
      })
      // Retried requests succeed
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { ok: 1 } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { ok: 1 } }),
      });

    // Mock auth-store: token present and not expired to avoid preflight refresh
    jest.doMock('@/stores/auth-store', () => {
      const original = jest.requireActual('@/stores/auth-store');
      return {
        ...original,
        getAccessToken: () => 'old.jwt.token',
        getRefreshToken: () => null,
        useAuthStore: {
          getState: () => ({
            isAccessTokenExpired: () => false,
            updateTokens: jest.fn(),
            clearSession: jest.fn(),
            refreshTokens: original.useAuthStore.getState().refreshTokens,
          }),
        },
      };
    });

    const { apiRequest: api } = await import('@/lib/api/client');
    const [res1, res2] = await Promise.all([api<any>(`/a`), api<any>(`/b`)]);
    expect(res1.status).toBe('success');
    expect(res2.status).toBe('success');
    const calls = (global as any).fetch.mock.calls.map((c: any[]) =>
      String(c[0])
    );
    const refreshCalls = calls.filter((u: string) =>
      u.includes('/auth/refresh')
    );
    expect(refreshCalls.length).toBe(1);
  });
});
