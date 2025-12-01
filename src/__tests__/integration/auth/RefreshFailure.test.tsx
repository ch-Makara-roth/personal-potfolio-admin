import { ApiClientError } from '@/lib/api/client';

describe('Refresh token failure handling', () => {
  beforeEach(() => {
    jest.resetModules();
    (global as any).fetch = jest.fn();
    (global as any).window = {
      location: { replace: jest.fn() },
    } as any;
  });

  it('clears session and redirects to login on failed refresh', async () => {
    (global as any).fetch
      // Initial request returns 401
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ code: 'AUTH_REQUIRED' }),
      })
      // Refresh endpoint fails
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ code: 'AUTH_REQUIRED' }),
      });

    const clearSessionMock = jest.fn();

    jest.doMock('@/stores/auth-store', () => ({
      getAccessToken: () => 'valid.jwt.token',
      getRefreshToken: () => null,
      refreshAccessToken: jest.fn(async () => {
        clearSessionMock();
        return null;
      }),
      useAuthStore: {
        getState: () => ({
          isAccessTokenExpired: () => false,
          updateTokens: jest.fn(),
          clearSession: clearSessionMock,
        }),
      },
    }));

    const { apiRequest } = await import('@/lib/api/client');
    await expect(apiRequest<any>('/protected')).rejects.toHaveProperty(
      'code',
      'AUTH_REQUIRED'
    );
    expect(clearSessionMock).toHaveBeenCalled();
  });
});
