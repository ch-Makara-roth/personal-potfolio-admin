import React from 'react';
import { render, act } from '@testing-library/react';
import { AuthGuard } from '../AuthGuard';
import { useAuthStore } from '@/stores/auth-store';

jest.mock('next/navigation', () => {
  const replace = jest.fn();
  return {
    useRouter: () => ({ replace }),
    usePathname: () => '/dashboard',
  };
});

jest.mock('@/lib/api', () => {
  return {
    refreshAccessToken: jest.fn(async () => ({
      accessToken: 'new.token',
      expiresIn: 3600,
    })),
  };
});

function createExpiredJwt() {
  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' })
  ).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 60 })
  ).toString('base64url');
  const signature = 'sig';
  return `${header}.${payload}.${signature}`;
}

describe('AuthGuard refresh behavior', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { id: 'u1', email: 'u@example.com' } as any,
      tokens: { accessToken: createExpiredJwt(), refreshToken: 'r' } as any,
      isAuthenticated: true,
      hasHydrated: true,
      setSession: useAuthStore.getState().setSession,
      updateTokens: useAuthStore.getState().updateTokens,
      clearSession: useAuthStore.getState().clearSession,
      isAccessTokenExpired: useAuthStore.getState().isAccessTokenExpired,
    });
    jest.clearAllMocks();
  });

  it('does not redirect when refresh succeeds', async () => {
    const { useRouter } = require('next/navigation');
    const router = useRouter();
    await act(async () => {
      render(<AuthGuard />);
    });
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('redirects when refresh fails', async () => {
    const { refreshAccessToken } = require('@/lib/api');
    refreshAccessToken.mockResolvedValueOnce(null);
    const { useRouter } = require('next/navigation');
    const router = useRouter();
    await act(async () => {
      render(<AuthGuard />);
    });
    expect(router.replace).toHaveBeenCalledWith('/login');
  });
});
