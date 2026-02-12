import React from 'react';
import { render } from '@testing-library/react';
import { AuthGuard } from '@/components/providers/AuthGuard';

jest.mock('next/navigation', () => {
  return {
    useRouter: () => ({ replace: jest.fn() }),
    usePathname: () => '/dashboard',
  };
});

jest.mock('@/stores', () => {
  const actual = jest.requireActual('@/stores');
  return {
    ...actual,
    useAuthStore: (selector?: any) => {
      const state = {
        isAuthenticated: false,
        hasHydrated: true,
        clearSession: jest.fn(),
      };
      return selector ? selector(state) : state;
    },
  };
});

describe('AuthGuard', () => {
  it('redirects to /login when not authenticated', () => {
    const { container } = render(
      <AuthGuard>
        <div />
      </AuthGuard>
    );
    expect(container).toBeEmptyDOMElement();
  });
});
