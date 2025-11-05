// Export all stores
export * from './ui-store';
export * from './notification-store';
export * from './user-preferences-store';
export * from './auth-store';

// Import stores for local usage in this module
import { useUIStore } from './ui-store';
import { useNotificationStore } from './notification-store';
import { useUserPreferencesStore } from './user-preferences-store';

// Re-export commonly used hooks and utilities
export {
  useUIStore,
  useSidebarState,
  useThemeState,
  useLayoutState,
  useOverlayState,
  useLoadingState,
} from './ui-store';

export {
  useNotificationStore,
  useNotifications,
  useToasts,
  useUnreadCount,
  useNotificationPreferences,
  useNotificationActions,
  createSuccessNotification,
  createErrorNotification,
  createWarningNotification,
  createInfoNotification,
} from './notification-store';

export {
  useUserPreferencesStore,
  useDashboardPreferences,
  useTablePreferences,
  useCalendarPreferences,
  useAccessibilityPreferences,
  usePreferenceActions,
} from './user-preferences-store';

export { useAuthStore } from './auth-store';

// Store initialization utility
export const initializeStores = () => {
  // This function can be called on app startup to initialize stores
  // and apply any necessary DOM changes based on persisted state

  if (typeof window !== 'undefined') {
    // Initialize UI store theme
    const uiState = useUIStore.getState();
    if (uiState.theme) {
      const root = document.documentElement;

      if (uiState.theme === 'system') {
        const prefersDark = window.matchMedia(
          '(prefers-color-scheme: dark)'
        ).matches;
        root.classList.toggle('dark', prefersDark);
      } else {
        root.classList.toggle('dark', uiState.theme === 'dark');
      }

      if (uiState.reducedMotion) {
        root.style.setProperty('--motion-reduce', '1');
      }

      if (uiState.highContrast) {
        root.classList.add('high-contrast');
      }
    }

    // Initialize accessibility preferences
    const preferencesState = useUserPreferencesStore.getState();
    if (preferencesState.accessibility) {
      const root = document.documentElement;
      const { accessibility } = preferencesState;

      const fontSizeMap: Record<string, string> = {
        small: '14px',
        medium: '16px',
        large: '18px',
        'extra-large': '20px',
      };

      const lineHeightMap: Record<string, string> = {
        normal: '1.5',
        relaxed: '1.625',
        loose: '1.75',
      };

      const letterSpacingMap: Record<string, string> = {
        normal: '0',
        wide: '0.025em',
        wider: '0.05em',
      };

      root.style.setProperty(
        '--font-size-base',
        fontSizeMap[accessibility.fontSize]
      );
      root.style.setProperty(
        '--line-height-base',
        lineHeightMap[accessibility.lineHeight]
      );
      root.style.setProperty(
        '--letter-spacing-base',
        letterSpacingMap[accessibility.letterSpacing]
      );

      root.classList.toggle(
        'enhanced-focus',
        accessibility.enhancedFocusIndicators
      );
    }
  }
};

// Store reset utility (useful for testing or logout)
export const resetAllStores = () => {
  const { resetUIState } = useUIStore.getState();
  const { clearNotifications, clearToasts } = useNotificationStore.getState();
  const { resetAllPreferences } = useUserPreferencesStore.getState();

  resetUIState();
  clearNotifications();
  clearToasts();
  resetAllPreferences();
};

// Store persistence utilities
export const clearStorePersistence = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('ui-store');
    localStorage.removeItem('notification-store');
    localStorage.removeItem('user-preferences-store');
  }
};

export const getStoreData = () => {
  if (typeof window === 'undefined') return null;

  return {
    ui: localStorage.getItem('ui-store'),
    notifications: localStorage.getItem('notification-store'),
    preferences: localStorage.getItem('user-preferences-store'),
  };
};

// Type exports for convenience
export type {
  NotificationType,
  Notification,
  NotificationPreferences,
} from './notification-store';

export type {
  DashboardPreferences,
  TablePreferences,
  CalendarPreferences,
  AccessibilityPreferences,
} from './user-preferences-store';
