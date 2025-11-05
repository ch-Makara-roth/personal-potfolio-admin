import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Notification types
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // in milliseconds, 0 means persistent
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  timestamp: number;
  read?: boolean;
}

export interface NotificationPreferences {
  enableToasts: boolean;
  enableSounds: boolean;
  enableDesktopNotifications: boolean;
  toastPosition:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'bottom-center';
  maxToasts: number;
  defaultDuration: number;
  groupSimilar: boolean;
}

// Notification State Interface
interface NotificationState {
  // Notifications
  notifications: Notification[];
  toasts: Notification[];
  unreadCount: number;

  // Preferences
  preferences: NotificationPreferences;

  // Actions
  addNotification: (
    notification: Omit<Notification, 'id' | 'timestamp'>
  ) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;

  // Toast actions
  showToast: (toast: Omit<Notification, 'id' | 'timestamp'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  // Preference actions
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void;
  resetPreferences: () => void;

  // Utility actions
  getNotificationById: (id: string) => Notification | undefined;
  getUnreadNotifications: () => Notification[];
  hasUnreadNotifications: () => boolean;
}

// Default preferences
const defaultPreferences: NotificationPreferences = {
  enableToasts: true,
  enableSounds: false,
  enableDesktopNotifications: false,
  toastPosition: 'top-right',
  maxToasts: 5,
  defaultDuration: 5000, // 5 seconds
  groupSimilar: true,
};

// Generate unique ID for notifications
const generateId = () =>
  `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Create notification store with persistence
export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      toasts: [],
      unreadCount: 0,
      preferences: defaultPreferences,

      // Add notification to the persistent list
      addNotification: (notification) => {
        const id = generateId();
        const newNotification: Notification = {
          ...notification,
          id,
          timestamp: Date.now(),
          read: false,
          dismissible: notification.dismissible ?? true,
        };

        set((state) => {
          const notifications = [newNotification, ...state.notifications];
          const unreadCount = notifications.filter((n) => !n.read).length;

          return {
            notifications,
            unreadCount,
          };
        });

        // Also show as toast if enabled
        if (get().preferences.enableToasts) {
          get().showToast(notification);
        }

        // Request desktop notification permission if enabled
        if (
          get().preferences.enableDesktopNotifications &&
          'Notification' in window
        ) {
          if (Notification.permission === 'granted') {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/favicon.ico',
            });
          } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then((permission) => {
              if (permission === 'granted') {
                new Notification(notification.title, {
                  body: notification.message,
                  icon: '/favicon.ico',
                });
              }
            });
          }
        }

        return id;
      },

      // Remove notification from persistent list
      removeNotification: (id) =>
        set((state) => {
          const notifications = state.notifications.filter((n) => n.id !== id);
          const unreadCount = notifications.filter((n) => !n.read).length;

          return {
            notifications,
            unreadCount,
          };
        }),

      // Clear all notifications
      clearNotifications: () =>
        set({
          notifications: [],
          unreadCount: 0,
        }),

      // Mark notification as read
      markAsRead: (id) =>
        set((state) => {
          const notifications = state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          );
          const unreadCount = notifications.filter((n) => !n.read).length;

          return {
            notifications,
            unreadCount,
          };
        }),

      // Mark all notifications as read
      markAllAsRead: () =>
        set((state) => {
          const notifications = state.notifications.map((n) => ({
            ...n,
            read: true,
          }));

          return {
            notifications,
            unreadCount: 0,
          };
        }),

      // Show toast notification (temporary)
      showToast: (toast) => {
        const id = generateId();
        const preferences = get().preferences;

        const newToast: Notification = {
          ...toast,
          id,
          timestamp: Date.now(),
          duration: toast.duration ?? preferences.defaultDuration,
          dismissible: toast.dismissible ?? true,
        };

        set((state) => {
          let toasts = [...state.toasts, newToast];

          // Limit number of toasts
          if (toasts.length > preferences.maxToasts) {
            toasts = toasts.slice(-preferences.maxToasts);
          }

          return { toasts };
        });

        // Auto-remove toast after duration
        if (newToast.duration && newToast.duration > 0) {
          setTimeout(() => {
            get().removeToast(id);
          }, newToast.duration);
        }

        return id;
      },

      // Remove toast
      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),

      // Clear all toasts
      clearToasts: () => set({ toasts: [] }),

      // Update preferences
      updatePreferences: (newPreferences) =>
        set((state) => ({
          preferences: { ...state.preferences, ...newPreferences },
        })),

      // Reset preferences to default
      resetPreferences: () => set({ preferences: defaultPreferences }),

      // Utility functions
      getNotificationById: (id) => {
        return get().notifications.find((n) => n.id === id);
      },

      getUnreadNotifications: () => {
        return get().notifications.filter((n) => !n.read);
      },

      hasUnreadNotifications: () => {
        return get().unreadCount > 0;
      },
    }),
    {
      name: 'notification-store',
      storage: createJSONStorage(() => localStorage),

      // Only persist notifications and preferences, not toasts
      partialize: (state) => ({
        notifications: state.notifications,
        preferences: state.preferences,
        unreadCount: state.unreadCount,
      }),
    }
  )
);

// Selectors for notification state
export const selectNotifications = (state: NotificationState) =>
  state.notifications;
export const selectToasts = (state: NotificationState) => state.toasts;
export const selectUnreadCount = (state: NotificationState) =>
  state.unreadCount;
export const selectPreferences = (state: NotificationState) =>
  state.preferences;

// Hooks for specific notification functionality
export const useNotifications = () => useNotificationStore(selectNotifications);
export const useToasts = () => useNotificationStore(selectToasts);
export const useUnreadCount = () => useNotificationStore(selectUnreadCount);
export const useNotificationPreferences = () =>
  useNotificationStore(selectPreferences);

// Convenience hooks for common actions
export const useNotificationActions = () => {
  const store = useNotificationStore();

  return {
    addNotification: store.addNotification,
    removeNotification: store.removeNotification,
    clearNotifications: store.clearNotifications,
    markAsRead: store.markAsRead,
    markAllAsRead: store.markAllAsRead,
    showToast: store.showToast,
    removeToast: store.removeToast,
    clearToasts: store.clearToasts,
  };
};

// Utility functions for creating common notification types
export const createSuccessNotification = (
  title: string,
  message?: string
): Omit<Notification, 'id' | 'timestamp'> => ({
  type: 'success',
  title,
  message,
  duration: 4000,
});

export const createErrorNotification = (
  title: string,
  message?: string
): Omit<Notification, 'id' | 'timestamp'> => ({
  type: 'error',
  title,
  message,
  duration: 0, // Persistent for errors
});

export const createWarningNotification = (
  title: string,
  message?: string
): Omit<Notification, 'id' | 'timestamp'> => ({
  type: 'warning',
  title,
  message,
  duration: 6000,
});

export const createInfoNotification = (
  title: string,
  message?: string
): Omit<Notification, 'id' | 'timestamp'> => ({
  type: 'info',
  title,
  message,
  duration: 5000,
});
