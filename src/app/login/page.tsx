'use client';
/* eslint-disable @next/next/no-img-element */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores';
import { useNotificationActions } from '@/stores';
import { Eye, EyeOff, Apple } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const { showToast } = useNotificationActions();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.login({ identifier, password });
      setSession(res.data.user, res.data.tokens);
      showToast({
        type: 'success',
        title: 'Welcome back!',
        message: 'Login successful',
      });
      router.replace('/dashboard');
    } catch (err: any) {
      const message = err?.message || 'Login failed. Please try again.';
      setError(message);
      showToast({ type: 'error', title: 'Login failed', message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 grid grid-cols-1 md:grid-cols-2">
      {/* Left: Gradient panel with brand and form (full height) */}
      <div className="relative flex items-center justify-center bg-gradient-to-br from-yellow-50 via-gray-50 to-yellow-100 p-6 sm:p-8 md:p-12 lg:p-16 min-h-[60vh] md:min-h-screen">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-semibold text-gray-900">Sign in</h1>
          <p className="mt-1 text-sm text-gray-500">
            Sign in and get 30 day free trial
          </p>

          <form
            onSubmit={onSubmit}
            className="mt-6 space-y-4"
            aria-describedby={error ? 'login-error' : undefined}
          >
            {/* Identifier */}
            <div>
              <label
                htmlFor="identifier"
                className="block text-sm font-medium text-gray-700"
              >
                Email or Username
              </label>
              <input
                id="identifier"
                type="text"
                autoComplete="username email"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="mt-1 block w-full rounded-full border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            {/* Password with show/hide toggle */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-full border border-gray-300 bg-white px-4 py-3 pr-12 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && (
              <p
                id="login-error"
                role="alert"
                aria-live="polite"
                className="text-sm text-red-600"
              >
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full rounded-full bg-yellow-400 text-gray-900 hover:bg-yellow-300"
              loading={loading}
              loadingText="Signing in..."
            >
              Submit
            </Button>
            {/* <div className="mt-4 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className="flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <Apple size={18} /> Apple
                    </button>
                    <button
                      type="button"
                      className="flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path fill="#EA4335" d="M12 10v4h5.6c-.24 1.28-1.35 3.76-5.6 3.76A6.76 6.76 0 0 1 6.24 12 6.76 6.76 0 0 1 12 5.24c1.92 0 3.2.8 3.92 1.48l2.68-2.6C17.28 2.4 14.88 1.5 12 1.5 6.72 1.5 2.5 5.72 2.5 12S6.72 22.5 12 22.5c6.32 0 9.5-4.44 9.5-8.56 0-.64-.08-1.04-.16-1.44H12Z"/>
                        <path fill="#34A853" d="M3.18 7.41 6.24 9.64A6.76 6.76 0 0 1 12 5.24c1.92 0 3.2.8 3.92 1.48l2.68-2.6C17.28 2.4 14.88 1.5 12 1.5 8.67 1.5 5.74 3.02 3.96 5.12Z" opacity=".001"/>
                        <path fill="#FBBC05" d="M21.34 13.94c-.24 1.28-1.35 3.76-5.6 3.76A6.76 6.76 0 0 1 6.24 12c0-.82.15-1.6.41-2.32L3.18 7.41A9.44 9.44 0 0 0 2.5 12c0 5.28 4.22 9.5 9.5 9.5 4.9 0 8.74-3.2 9.34-7.56Z"/>
                        <path fill="#4285F4" d="M12 22.5c6.32 0 9.5-4.44 9.5-8.56 0-.64-.08-1.04-.16-1.44H12v4h5.6c-.8 4.08-4.32 6-5.6 6Z" opacity=".8"/>
                      </svg>
                      Google
                    </button>
                  </div>
                  <div className="mt-6 flex items-center justify-between text-xs text-gray-500">
                    <span>
                      Have any account?{' '}
                      <a href="#" className="font-semibold text-gray-700 hover:underline">Sign in</a>
                    </span>
                    <a href="#" className="hover:underline">Terms &amp; Conditions</a>
                  </div> */}
          </form>
        </div>
      </div>

      {/* Right: Hero photo with overlays (full height) */}
      <div className="relative hidden md:block min-h-[60vh] md:min-h-screen bg-gray-900">
        {/* Background photo */}
        <img
          src="https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1920&auto=format&fit=crop"
          alt="Team collaborating around a desk"
          className="h-full w-full object-cover"
        />
        {/* mini calendar bottom center */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-28">
          <div className="rounded-2xl bg-white/60 backdrop-blur-glass p-3 shadow-card">
            <div className="grid grid-cols-7 gap-2 text-center">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="text-[10px] text-gray-700">
                  {d}
                </div>
              ))}
              {[22, 23, 24, 25, 26, 27, 28].map((n, i) => (
                <div
                  key={n}
                  className={`rounded-md px-2 py-1 text-[11px] ${i >= 2 && i <= 5 ? 'bg-white/80' : 'bg-transparent'} text-gray-900`}
                >
                  {n}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
