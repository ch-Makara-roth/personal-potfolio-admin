import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthTokens, AuthUser } from '@/types/api';

interface AuthState {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;

  setSession: (user: AuthUser, tokens: AuthTokens) => void;
  updateTokens: (tokens: AuthTokens) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      hasHydrated: false,

      setSession: (user, tokens) =>
        set({ user, tokens, isAuthenticated: Boolean(tokens?.accessToken) }),

      updateTokens: (tokens) =>
        set((state) => ({
          tokens,
          isAuthenticated: Boolean(tokens?.accessToken),
          user: state.user,
        })),

      clearSession: () =>
        set({ user: null, tokens: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => localStorage),
      // Persist only necessary fields
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
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
    const raw = localStorage.getItem('auth-store');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.tokens?.accessToken ?? null;
  } catch {
    return null;
  }
};

export const getRefreshToken = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('auth-store');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.tokens?.refreshToken ?? null;
  } catch {
    return null;
  }
};
