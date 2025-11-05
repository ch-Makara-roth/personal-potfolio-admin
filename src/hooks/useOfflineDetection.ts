import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/Toast';
import {
  useNotificationActions,
  createWarningNotification,
  createSuccessNotification,
} from '@/stores/notification-store';

interface OfflineState {
  isOnline: boolean;
  isOffline: boolean;
  wasOffline: boolean;
  downtime: number; // in milliseconds
  lastOnlineTime: number | null;
  connectionType: string | null;
  effectiveType: string | null;
}

interface OfflineDetectionOptions {
  pingUrl?: string;
  pingInterval?: number; // in milliseconds
  pingTimeout?: number; // in milliseconds
  showNotifications?: boolean;
  enablePing?: boolean;
}

const defaultOptions: Required<OfflineDetectionOptions> = {
  pingUrl: '/api/ping',
  pingInterval: 30000, // 30 seconds
  pingTimeout: 5000, // 5 seconds
  showNotifications: true,
  enablePing: true,
};

export const useOfflineDetection = (options: OfflineDetectionOptions = {}) => {
  const config = { ...defaultOptions, ...options };
  const toast = useToast();
  const { addNotification } = useNotificationActions();

  const [state, setState] = useState<OfflineState>(() => ({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
    wasOffline: false,
    downtime: 0,
    lastOnlineTime: Date.now(),
    connectionType: null,
    effectiveType: null,
  }));

  // Get connection information
  const getConnectionInfo = useCallback(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return {
        connectionType: connection?.type || null,
        effectiveType: connection?.effectiveType || null,
      };
    }
    return { connectionType: null, effectiveType: null };
  }, []);

  // Ping server to verify actual connectivity
  const pingServer = useCallback(async (): Promise<boolean> => {
    if (!config.enablePing) return navigator.onLine;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        config.pingTimeout
      );

      const response = await fetch(config.pingUrl, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn('Ping failed:', error);
      return false;
    }
  }, [config.enablePing, config.pingUrl, config.pingTimeout]);

  // Handle online status change
  const handleOnline = useCallback(() => {
    const connectionInfo = getConnectionInfo();
    const now = Date.now();

    setState((prevState) => {
      const downtime =
        prevState.wasOffline && prevState.lastOnlineTime
          ? now - prevState.lastOnlineTime
          : 0;

      return {
        isOnline: true,
        isOffline: false,
        wasOffline: prevState.wasOffline,
        downtime,
        lastOnlineTime: now,
        ...connectionInfo,
      };
    });

    // Show reconnection notification
    if (config.showNotifications && state.wasOffline) {
      const downtimeMinutes = Math.round(state.downtime / 60000);
      const message =
        downtimeMinutes > 0
          ? `Connection restored after ${downtimeMinutes} minute${downtimeMinutes !== 1 ? 's' : ''}`
          : 'Connection restored';

      toast.success('Back online', message);

      addNotification(
        createSuccessNotification(
          'Connection Restored',
          'You are back online. Data will be synchronized automatically.'
        )
      );
    }
  }, [
    config.showNotifications,
    state.wasOffline,
    state.downtime,
    getConnectionInfo,
    toast,
    addNotification,
  ]);

  // Handle offline status change
  const handleOffline = useCallback(() => {
    const connectionInfo = getConnectionInfo();

    setState((prevState) => ({
      isOnline: false,
      isOffline: true,
      wasOffline: true,
      downtime: 0,
      lastOnlineTime: prevState.lastOnlineTime,
      ...connectionInfo,
    }));

    // Show offline notification
    if (config.showNotifications) {
      toast.warning(
        'Connection lost',
        'You are currently offline. Some features may be limited.',
        { duration: 0 } // Persistent until back online
      );

      addNotification(
        createWarningNotification(
          'Offline Mode',
          'You are currently offline. Changes will be saved locally and synchronized when connection is restored.'
        )
      );
    }
  }, [config.showNotifications, getConnectionInfo, toast, addNotification]);

  // Verify connection with server ping
  const verifyConnection = useCallback(async () => {
    if (!navigator.onLine) {
      if (state.isOnline) {
        handleOffline();
      }
      return;
    }

    const isActuallyOnline = await pingServer();

    if (isActuallyOnline && !state.isOnline) {
      handleOnline();
    } else if (!isActuallyOnline && state.isOnline) {
      handleOffline();
    }
  }, [state.isOnline, pingServer, handleOnline, handleOffline]);

  // Set up event listeners and ping interval
  useEffect(() => {
    // Initial connection check
    verifyConnection();

    // Listen for browser online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set up periodic ping to verify actual connectivity
    let pingInterval: NodeJS.Timeout | null = null;

    if (config.enablePing) {
      pingInterval = setInterval(verifyConnection, config.pingInterval);
    }

    // Listen for connection changes (if supported)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const handleConnectionChange = () => {
        const connectionInfo = getConnectionInfo();
        setState((prevState) => ({ ...prevState, ...connectionInfo }));

        // Verify connection when connection type changes
        setTimeout(verifyConnection, 1000);
      };

      connection?.addEventListener('change', handleConnectionChange);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        if (pingInterval) clearInterval(pingInterval);
        connection?.removeEventListener('change', handleConnectionChange);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (pingInterval) clearInterval(pingInterval);
    };
  }, [
    config.enablePing,
    config.pingInterval,
    handleOnline,
    handleOffline,
    verifyConnection,
    getConnectionInfo,
  ]);

  // Manual retry function
  const retry = useCallback(async () => {
    const isOnline = await pingServer();

    if (isOnline) {
      handleOnline();
    } else {
      if (config.showNotifications) {
        toast.error(
          'Still offline',
          'Unable to establish connection. Please check your internet connection.'
        );
      }
    }

    return isOnline;
  }, [pingServer, handleOnline, config.showNotifications, toast]);

  // Get connection quality indicator
  const getConnectionQuality = useCallback(():
    | 'excellent'
    | 'good'
    | 'fair'
    | 'poor'
    | 'offline' => {
    if (!state.isOnline) return 'offline';

    if (state.effectiveType) {
      switch (state.effectiveType) {
        case '4g':
          return 'excellent';
        case '3g':
          return 'good';
        case '2g':
          return 'fair';
        case 'slow-2g':
          return 'poor';
        default:
          return 'good';
      }
    }

    return 'good';
  }, [state.isOnline, state.effectiveType]);

  return {
    ...state,
    retry,
    verifyConnection,
    getConnectionQuality: getConnectionQuality(),

    // Utility methods
    isSlowConnection:
      state.effectiveType === '2g' || state.effectiveType === 'slow-2g',
    isFastConnection: state.effectiveType === '4g',
    hasConnectionInfo:
      state.connectionType !== null || state.effectiveType !== null,
  };
};

// Hook for components that need to handle offline state
export const useOfflineHandler = (options: OfflineDetectionOptions = {}) => {
  const offlineState = useOfflineDetection(options);

  // Queue for offline actions
  const [offlineQueue, setOfflineQueue] = useState<Array<() => Promise<void>>>(
    []
  );

  // Add action to offline queue
  const queueAction = useCallback(
    (action: () => Promise<void>) => {
      if (offlineState.isOffline) {
        setOfflineQueue((prev) => [...prev, action]);
        return false; // Action was queued
      }
      return true; // Action can be executed immediately
    },
    [offlineState.isOffline]
  );

  // Process offline queue when back online
  useEffect(() => {
    if (offlineState.isOnline && offlineQueue.length > 0) {
      const processQueue = async () => {
        const actions = [...offlineQueue];
        setOfflineQueue([]);

        for (const action of actions) {
          try {
            await action();
          } catch (error) {
            console.error('Failed to process queued action:', error);
            // Re-queue failed actions
            setOfflineQueue((prev) => [...prev, action]);
          }
        }
      };

      processQueue();
    }
  }, [offlineState.isOnline, offlineQueue]);

  return {
    ...offlineState,
    queueAction,
    queuedActionsCount: offlineQueue.length,
    clearQueue: () => setOfflineQueue([]),
  };
};

export default useOfflineDetection;
