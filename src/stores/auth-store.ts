import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthTokens, AuthUser } from '@/types/api';
import { refreshSession } from '@/lib/api/auth-api';

// Utility: decode JWT and get expiration timestamp (seconds)
function getJwtExp(token?: string | null): number | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    if (typeof decoded?.exp === 'number') return decoded.exp;
    return null;
  } catch {
    return null;
  }
}

interface AuthState {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;

  setSession: (user: AuthUser, tokens: AuthTokens) => void;
  updateTokens: (tokens: AuthTokens) => void;
  clearSession: () => void;
  isAccessTokenExpired: () => boolean;
  refreshTokens: () => Promise<AuthTokens | null>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      hasHydrated: false,

      setSession: (user, tokens) => {
        set({
          user,
          tokens,
          isAuthenticated: Boolean(tokens?.accessToken),
        });
        scheduleAutoRefresh();
      },

      updateTokens: (tokens) => {
        set((state) => ({
          tokens,
          isAuthenticated: Boolean(tokens?.accessToken),
          user: state.user,
        }));
        scheduleAutoRefresh();
        if (typeof document !== 'undefined' && tokens?.accessToken) {
          const maxAge = tokens.expiresIn || 86400;
          document.cookie = `auth_token=${tokens.accessToken}; path=/; max-age=${maxAge}; SameSite=Lax`;
        }
      },

      clearSession: () => {
        set({ user: null, tokens: null, isAuthenticated: false });
        if (refreshTimer) {
          window.clearTimeout(refreshTimer);
          refreshTimer = null;
        }
        if (typeof document !== 'undefined') {
          document.cookie = 'auth_token=; path=/; max-age=0; SameSite=Lax';
        }
      },

      isAccessTokenExpired: () => {
        const token = get().tokens?.accessToken || null;
        const exp = getJwtExp(token);
        if (!exp) return false; // if exp missing, treat as not expired and rely on server validation
        const nowSec = Math.floor(Date.now() / 1000);
        return exp <= nowSec;
      },

      refreshTokens: async () => {
        const refreshToken = get().tokens?.refreshToken;
        const newTokens = await refreshSession(refreshToken);

        if (newTokens) {
          get().updateTokens(newTokens);
          return newTokens;
        } else {
          get().clearSession();
          return null;
        }
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens
          ? {
              accessToken: state.tokens.accessToken,
              refreshToken: state.tokens.refreshToken,
              expiresIn: state.tokens.expiresIn,
            }
          : null,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => {
        return (state) => {
          useAuthStore.setState({ hasHydrated: true });
          if (state && state.tokens && state.tokens.accessToken) {
            scheduleAutoRefresh();
          }
        };
      },
    }
  )
);

let refreshTimer: number | null = null;
let refreshPromise: Promise<AuthTokens | null> | null = null;

// Exposed for the API client to trigger refresh
export async function refreshAccessToken(): Promise<AuthTokens | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = useAuthStore
    .getState()
    .refreshTokens()
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

function scheduleAutoRefresh() {
  try {
    const token = useAuthStore.getState().tokens?.accessToken || null;
    const exp = getJwtExp(token);
    if (!exp) return;

    const nowMs = Date.now();
    const refreshAtMs = exp * 1000 - 60000; // Refresh 1 minute before expiry
    const delay = Math.max(refreshAtMs - nowMs, 5000); // Minimum 5s delay

    if (refreshTimer) window.clearTimeout(refreshTimer);

    refreshTimer = window.setTimeout(async () => {
      await refreshAccessToken();
    }, delay);
  } catch {}
}

export const getAccessToken = () => {
  if (typeof window === 'undefined') return null;
  try {
    const inMemory = useAuthStore.getState().tokens?.accessToken ?? null;
    if (inMemory) return inMemory;
    const raw = localStorage.getItem('auth-store');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.tokens?.accessToken ?? null;
  } catch {
    return null;
  }
};

export const getRefreshToken = () => {
  try {
    const inMemory = useAuthStore.getState().tokens?.refreshToken ?? null;
    if (inMemory) return inMemory;
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('auth-store');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.tokens?.refreshToken ?? null;
  } catch {
    return null;
  }
};
