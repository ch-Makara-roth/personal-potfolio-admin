'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { useAuthStore, useNotificationActions } from '@/stores';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { logAuthEvent, reportAuthError } from '@/services/auth-logging';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession, isAuthenticated } = useAuthStore((s) => ({
    setSession: s.setSession,
    isAuthenticated: s.isAuthenticated,
  }));
  const { showToast } = useNotificationActions();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = searchParams.get('from') || '/dashboard';
      router.replace(from);
    }
  }, [isAuthenticated, router, searchParams]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    logAuthEvent('login_start');

    try {
      const res = await authApi.login({ identifier, password });
      setSession(res.data.user, res.data.tokens);

      // Set auth_token cookie for middleware
      const { accessToken, expiresIn } = res.data.tokens;
      const maxAge = expiresIn || 86400;
      document.cookie = `auth_token=${accessToken}; path=/; max-age=${maxAge}; SameSite=Lax`;

      logAuthEvent('login_success', { userId: res.data.user.id });
      showToast({
        type: 'success',
        title: 'Welcome back!',
        message: 'Login successful',
      });

      // Redirect will happen via useEffect or we can force it here
      const from = searchParams.get('from') || '/dashboard';
      router.replace(from);
    } catch (err: any) {
      const message = err?.message || 'Login failed. Please try again.';
      setError(message);
      logAuthEvent('login_failure');
      reportAuthError(err instanceof Error ? err : new Error(String(err)));
      showToast({ type: 'error', title: 'Login failed', message });
      setLoading(false); // Only stop loading on error, let success redirect
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2">
      {/* Left: Form Panel */}
      <div className="relative flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 px-6 py-12 sm:px-8 md:px-12 lg:px-16 min-h-screen">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-indigo-100/40 to-purple-100/40 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-amber-100/30 to-orange-100/30 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

        <div className="relative w-full max-w-md z-10">
          {/* Brand/Logo area */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/25 mb-6">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Welcome back
            </h1>
            <p className="mt-2 text-gray-500">
              Sign in to access your admin dashboard
            </p>
          </div>

          <form
            onSubmit={onSubmit}
            className="space-y-5"
            aria-describedby={error ? 'login-error' : undefined}
          >
            {/* Identifier */}
            <div className="space-y-1.5">
              <label
                htmlFor="identifier"
                className="block text-sm font-medium text-gray-700"
              >
                Email or Username
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Mail size={18} />
                </div>
                <input
                  id="identifier"
                  type="text"
                  autoComplete="username email"
                  required
                  placeholder="Enter your email or username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="block w-full rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm pl-11 pr-4 py-3.5 text-gray-900 placeholder:text-gray-400 shadow-sm transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white hover:border-gray-300"
                />
              </div>
            </div>

            {/* Password with show/hide toggle */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm pl-11 pr-12 py-3.5 text-gray-900 placeholder:text-gray-400 shadow-sm transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white hover:border-gray-300"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Forgot password link */}
            <div className="flex justify-end">
              <a
                href="#"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                Forgot password?
              </a>
            </div>

            {error && (
              <div
                id="login-error"
                role="alert"
                aria-live="polite"
                className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600"
              >
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium py-3.5 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:from-indigo-500 hover:to-purple-500 transition-all duration-200"
              loading={loading}
              loadingText="Signing in..."
            >
              Sign in
            </Button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-gray-500">
            Protected by enterprise-grade security
          </p>
        </div>
      </div>

      {/* Right: Hero Image Panel */}
      <div className="relative hidden lg:flex flex-col items-center justify-center min-h-screen overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800" />

        {/* Pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Content overlay */}
        <div className="relative z-10 text-center px-12 max-w-lg">
          {/* Floating card illustration */}
          <div className="mb-8 relative">
            <div className="w-64 h-44 mx-auto bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-6 transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500" />
                <div className="space-y-1.5">
                  <div className="w-24 h-2.5 bg-white/40 rounded-full" />
                  <div className="w-16 h-2 bg-white/25 rounded-full" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-full h-2 bg-white/20 rounded-full" />
                <div className="w-4/5 h-2 bg-white/20 rounded-full" />
                <div className="w-3/5 h-2 bg-white/20 rounded-full" />
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-48 h-32 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-4 transform -rotate-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-green-400/80" />
                <div className="text-white/80 text-xs font-medium">+24%</div>
              </div>
              <div className="flex items-end gap-1 h-12">
                {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-white/30 rounded-t"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white mb-4">
            Manage Your Portfolio
          </h2>
          <p className="text-indigo-100/80 text-lg leading-relaxed">
            A powerful admin dashboard to manage your projects, skills, and
            professional content with ease.
          </p>
        </div>

        {/* Decorative blurs */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-purple-400/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-indigo-400/30 rounded-full blur-3xl" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
