'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore, refreshAccessToken } from '@/stores/auth-store';

export function AuthGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isAccessTokenExpired = useAuthStore((s) => s.isAccessTokenExpired);

  useEffect(() => {
    if (!hasHydrated) return;

    const attemptRefreshIfExpired = async () => {
      try {
        if (isAuthenticated && isAccessTokenExpired()) {
          const tokens = await refreshAccessToken();
          if (!tokens) {
            const redirect = '/login';
            if (pathname !== redirect) {
              router.replace(redirect);
            }
          }
          return;
        }
      } catch {}

      if (!isAuthenticated) {
        const redirect = '/login';
        if (pathname !== redirect) {
          router.replace(redirect);
        }
      }
    };

    attemptRefreshIfExpired();
  }, [hasHydrated, isAuthenticated, isAccessTokenExpired, router, pathname]);

  // Render nothing; this component only enforces redirect
  return null;
}
