import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// UI State Interface
interface UIState {
  // Sidebar state
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;

  // Theme and appearance
  theme: 'light' | 'dark' | 'system';
  reducedMotion: boolean;
  highContrast: boolean;

  // Layout preferences
  compactMode: boolean;
  gridDensity: 'comfortable' | 'compact' | 'spacious';

  // Modal and overlay state
  activeModal: string | null;
  activeDropdown: string | null;

  // Loading states
  globalLoading: boolean;
  loadingOperations: Set<string>;

  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleMobileSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;

  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setReducedMotion: (enabled: boolean) => void;
  setHighContrast: (enabled: boolean) => void;

  setCompactMode: (enabled: boolean) => void;
  setGridDensity: (density: 'comfortable' | 'compact' | 'spacious') => void;

  openModal: (modalId: string) => void;
  closeModal: () => void;
  openDropdown: (dropdownId: string) => void;
  closeDropdown: () => void;
  closeAllOverlays: () => void;

  setGlobalLoading: (loading: boolean) => void;
  addLoadingOperation: (operationId: string) => void;
  removeLoadingOperation: (operationId: string) => void;
  isOperationLoading: (operationId: string) => boolean;

  // Reset functions
  resetUIState: () => void;
}

// Default UI state
const defaultUIState = {
  sidebarCollapsed: false,
  sidebarMobileOpen: false,
  theme: 'light' as const,
  reducedMotion: false,
  highContrast: false,
  compactMode: false,
  gridDensity: 'comfortable' as const,
  activeModal: null,
  activeDropdown: null,
  globalLoading: false,
  loadingOperations: new Set<string>(),
};

// Create UI store with persistence
export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      ...defaultUIState,

      // Sidebar actions
      toggleSidebar: () =>
        set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed,
        })),

      setSidebarCollapsed: (collapsed: boolean) =>
        set({
          sidebarCollapsed: collapsed,
        }),

      toggleMobileSidebar: () =>
        set((state) => ({
          sidebarMobileOpen: !state.sidebarMobileOpen,
        })),

      setMobileSidebarOpen: (open: boolean) =>
        set({
          sidebarMobileOpen: open,
        }),

      // Theme and accessibility actions
      setTheme: (theme: 'light' | 'dark' | 'system') => {
        set({ theme });

        // Apply theme to document
        if (typeof document !== 'undefined') {
          const root = document.documentElement;

          if (theme === 'system') {
            const prefersDark = window.matchMedia(
              '(prefers-color-scheme: dark)'
            ).matches;
            root.classList.toggle('dark', prefersDark);
          } else {
            root.classList.toggle('dark', theme === 'dark');
          }
        }
      },

      setReducedMotion: (enabled: boolean) => {
        set({ reducedMotion: enabled });

        // Apply reduced motion preference
        if (typeof document !== 'undefined') {
          document.documentElement.style.setProperty(
            '--motion-reduce',
            enabled ? '1' : '0'
          );
        }
      },

      setHighContrast: (enabled: boolean) => {
        set({ highContrast: enabled });

        // Apply high contrast mode
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('high-contrast', enabled);
        }
      },

      // Layout preference actions
      setCompactMode: (enabled: boolean) => set({ compactMode: enabled }),

      setGridDensity: (density: 'comfortable' | 'compact' | 'spacious') =>
        set({ gridDensity: density }),

      // Modal and overlay actions
      openModal: (modalId: string) =>
        set({
          activeModal: modalId,
          activeDropdown: null, // Close dropdown when opening modal
        }),

      closeModal: () => set({ activeModal: null }),

      openDropdown: (dropdownId: string) =>
        set({
          activeDropdown: dropdownId,
          activeModal: null, // Close modal when opening dropdown
        }),

      closeDropdown: () => set({ activeDropdown: null }),

      closeAllOverlays: () =>
        set({
          activeModal: null,
          activeDropdown: null,
        }),

      // Loading state actions
      setGlobalLoading: (loading: boolean) => set({ globalLoading: loading }),

      addLoadingOperation: (operationId: string) =>
        set((state) => {
          const newOperations = new Set(state.loadingOperations);
          newOperations.add(operationId);
          return { loadingOperations: newOperations };
        }),

      removeLoadingOperation: (operationId: string) =>
        set((state) => {
          const newOperations = new Set(state.loadingOperations);
          newOperations.delete(operationId);
          return { loadingOperations: newOperations };
        }),

      isOperationLoading: (operationId: string) => {
        return get().loadingOperations.has(operationId);
      },

      // Reset function
      resetUIState: () => set(defaultUIState),
    }),
    {
      name: 'ui-store',
      storage: createJSONStorage(() => localStorage),

      // Only persist certain UI preferences
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        reducedMotion: state.reducedMotion,
        highContrast: state.highContrast,
        compactMode: state.compactMode,
        gridDensity: state.gridDensity,
      }),

      // Handle hydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Apply theme on hydration
          if (typeof document !== 'undefined') {
            const root = document.documentElement;

            if (state.theme === 'system') {
              const prefersDark = window.matchMedia(
                '(prefers-color-scheme: dark)'
              ).matches;
              root.classList.toggle('dark', prefersDark);
            } else {
              root.classList.toggle('dark', state.theme === 'dark');
            }

            // Apply accessibility preferences
            if (state.reducedMotion) {
              root.style.setProperty('--motion-reduce', '1');
            }

            if (state.highContrast) {
              root.classList.add('high-contrast');
            }
          }
        }
      },
    }
  )
);

// Selectors for common UI state
export const selectSidebarState = (state: UIState) => ({
  collapsed: state.sidebarCollapsed,
  mobileOpen: state.sidebarMobileOpen,
});

export const selectThemeState = (state: UIState) => ({
  theme: state.theme,
  reducedMotion: state.reducedMotion,
  highContrast: state.highContrast,
});

export const selectLayoutState = (state: UIState) => ({
  compactMode: state.compactMode,
  gridDensity: state.gridDensity,
});

export const selectOverlayState = (state: UIState) => ({
  activeModal: state.activeModal,
  activeDropdown: state.activeDropdown,
});

export const selectLoadingState = (state: UIState) => ({
  globalLoading: state.globalLoading,
  loadingOperations: state.loadingOperations,
});

// Hook for sidebar state
export const useSidebarState = () => useUIStore(selectSidebarState);

// Hook for theme state
export const useThemeState = () => useUIStore(selectThemeState);

// Hook for layout state
export const useLayoutState = () => useUIStore(selectLayoutState);

// Hook for overlay state
export const useOverlayState = () => useUIStore(selectOverlayState);

// Hook for loading state
export const useLoadingState = () => useUIStore(selectLoadingState);
