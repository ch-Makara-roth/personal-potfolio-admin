'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores';

export function AuthGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  useEffect(() => {
    // Wait until auth store has hydrated before deciding
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      const redirect = '/login';
      // If already at login, do nothing
      if (pathname !== redirect) {
        router.replace(redirect);
      }
    }
  }, [hasHydrated, isAuthenticated, router, pathname]);

  // Render nothing; this component only enforces redirect
  return null;
}
