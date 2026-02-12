'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore, refreshAccessToken } from '@/stores/auth-store';

const PUBLIC_PATHS = ['/login'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  // Using selector to prevent unnecessary re-renders when other state changes
  const isAccessTokenExpired = useAuthStore((s) => s.isAccessTokenExpired);
  const clearSession = useAuthStore((s) => s.clearSession);

  // Start verifying immediately if hydrated, otherwise wait
  const [isVerifying, setIsVerifying] = useState(true);

  // Safety fallback: If hydration takes too long, force it to finish (likely causing a logout if data didn't load)
  useEffect(() => {
    if (hasHydrated) return;

    const timer = setTimeout(() => {
      console.warn(
        'AuthGuard: Hydration timed out, forcing hydration completion.'
      );
      useAuthStore.setState({ hasHydrated: true });
    }, 2000);

    return () => clearTimeout(timer);
  }, [hasHydrated]);

  // Safety fallback: If verification takes too long, redirect to login
  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !isVerifying) return;

    const timer = setTimeout(() => {
      console.warn('AuthGuard: Verification timed out, redirecting to login.');
      clearSession();
      router.replace('/login');
    }, 5000);

    return () => clearTimeout(timer);
  }, [hasHydrated, isAuthenticated, isVerifying, clearSession, router]);

  useEffect(() => {
    // If not hydrated yet, we can't check auth state reliably.
    if (!hasHydrated) return;

    const checkAuth = async () => {
      try {
        // 1. Allow public paths immediately
        if (PUBLIC_PATHS.includes(pathname)) {
          setIsVerifying(false);
          return;
        }

        // 2. If authenticated, check if token needs refresh
        if (isAuthenticated) {
          if (isAccessTokenExpired()) {
            // Attempt silent refresh
            const tokens = await refreshAccessToken();
            if (!tokens) {
              // Refresh failed - session invalid
              clearSession();
              router.replace('/login');
              return;
            }
          }
          // Valid session
          setIsVerifying(false);
        } else {
          // 3. Not authenticated and trying to access protected route
          clearSession();
          router.replace('/login');
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        clearSession();
        router.replace('/login');
      }
    };

    checkAuth();
  }, [
    hasHydrated,
    isAuthenticated,
    isAccessTokenExpired,
    pathname,
    router,
    clearSession,
  ]);

  // If on a public path, render immediately to avoid blocking public pages
  if (PUBLIC_PATHS.includes(pathname)) {
    return <>{children}</>;
  }

  // If not hydrated, show loading spinner instead of null
  if (!hasHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Initializing...</p>
        </div>
      </div>
    );
  }

  // If verifying auth on protected route, show loading spinner
  if (isVerifying) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Verifying session...</p>
        </div>
      </div>
    );
  }

  // Authenticated and verified - render protected content
  return <>{children}</>;
}
