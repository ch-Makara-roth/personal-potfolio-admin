import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthTokens, AuthUser } from '@/types/api';

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
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      hasHydrated: false,

      setSession: (user, tokens) =>
        set({
          user,
          // Do not persist refreshToken for security. It will be available in-memory only
          tokens,
          isAuthenticated: Boolean(tokens?.accessToken),
        }),

      updateTokens: (tokens) =>
        set((state) => ({
          tokens,
          isAuthenticated: Boolean(tokens?.accessToken),
          user: state.user,
        })),

      clearSession: () =>
        set({ user: null, tokens: null, isAuthenticated: false }),

      isAccessTokenExpired: () => {
        const token = useAuthStore.getState().tokens?.accessToken || null;
        const exp = getJwtExp(token);
        if (!exp) return false; // if exp missing, treat as not expired and rely on server validation
        const nowSec = Math.floor(Date.now() / 1000);
        return exp <= nowSec;
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => localStorage),
      // Persist only necessary fields
      partialize: (state) => ({
        user: state.user,
        // Sanitize tokens: never persist refreshToken
        tokens: state.tokens
          ? {
              accessToken: state.tokens.accessToken,
              expiresIn: state.tokens.expiresIn,
            }
          : null,
        isAuthenticated: state.isAuthenticated,
      }),
      // Mark store as hydrated after persistence rehydrates
      onRehydrateStorage: () => {
        return (state, error) => {
          // Even if error, mark hydrated to avoid permanent redirect loops
          useAuthStore.setState({ hasHydrated: true });
        };
      },
    }
  )
);

export const getAccessToken = () => {
  if (typeof window === 'undefined') return null;
  try {
    // Prefer in-memory store to avoid stale localStorage
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
  // Refresh token should NOT be stored in localStorage.
  // Return from in-memory store if present; otherwise null.
  try {
    return useAuthStore.getState().tokens?.refreshToken ?? null;
  } catch {
    return null;
  }
};
