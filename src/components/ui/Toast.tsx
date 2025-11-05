import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import {
  useToasts,
  useNotificationActions,
  type Notification,
} from '@/stores/notification-store';
import { Button } from './Button';

// Toast component for individual notifications
interface ToastProps {
  notification: Notification;
  onDismiss: (id: string) => void;
  position:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'bottom-center';
}

const Toast: React.FC<ToastProps> = ({ notification, onDismiss, position }) => {
  const [isVisible, setIsVisible] = useState(true);

  // Auto-dismiss toast after duration
  useEffect(() => {
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onDismiss(notification.id), 300); // Wait for exit animation
      }, notification.duration);

      return () => clearTimeout(timer);
    }
  }, [notification.duration, notification.id, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(notification.id), 300);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getColorClasses = () => {
    switch (notification.type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const getAnimationDirection = () => {
    if (position.includes('right')) return { x: 400 };
    if (position.includes('left')) return { x: -400 };
    if (position.includes('top')) return { y: -100 };
    if (position.includes('bottom')) return { y: 100 };
    return { x: 400 };
  };

  return (
    <motion.div
      initial={getAnimationDirection()}
      animate={{ x: 0, y: 0, opacity: isVisible ? 1 : 0 }}
      exit={getAnimationDirection()}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`
        relative max-w-sm w-full rounded-lg border shadow-lg p-4 mb-3
        ${getColorClasses()}
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900">
            {notification.title}
          </h4>

          {notification.message && (
            <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
          )}

          {notification.action && (
            <div className="mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={notification.action.onClick}
                className="text-xs"
              >
                {notification.action.label}
              </Button>
            </div>
          )}
        </div>

        {notification.dismissible && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 ml-2 p-1 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Progress bar for timed toasts */}
      {notification.duration && notification.duration > 0 && (
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-current opacity-30 rounded-b-lg"
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{
            duration: notification.duration / 1000,
            ease: 'linear',
          }}
        />
      )}
    </motion.div>
  );
};

// Toast container component
interface ToastContainerProps {
  position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'bottom-center';
  maxToasts?: number;
}

const ToastContainer: React.FC<ToastContainerProps> = ({
  position = 'top-right',
  maxToasts = 5,
}) => {
  const toasts = useToasts();
  const { removeToast } = useNotificationActions();
  const [container, setContainer] = useState<HTMLElement | null>(null);

  // Create or get toast container
  useEffect(() => {
    let toastContainer = document.getElementById('toast-container');

    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      document.body.appendChild(toastContainer);
    }

    setContainer(toastContainer);

    return () => {
      // Clean up empty container
      if (toastContainer && toastContainer.children.length === 0) {
        document.body.removeChild(toastContainer);
      }
    };
  }, []);

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  // Limit number of visible toasts
  const visibleToasts = toasts.slice(0, maxToasts);

  if (!container || visibleToasts.length === 0) {
    return null;
  }

  return createPortal(
    <div
      className={`fixed z-50 pointer-events-none ${getPositionClasses()}`}
      aria-live="polite"
      aria-label="Notifications"
    >
      <div className="pointer-events-auto">
        <AnimatePresence mode="popLayout">
          {visibleToasts.map((toast) => (
            <Toast
              key={toast.id}
              notification={toast}
              onDismiss={removeToast}
              position={position}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>,
    container
  );
};

// Hook for showing toasts
export const useToast = () => {
  const { showToast } = useNotificationActions();

  const toast = {
    success: (
      title: string,
      message?: string,
      options?: Partial<Notification>
    ) => showToast({ type: 'success', title, message, ...options }),

    error: (title: string, message?: string, options?: Partial<Notification>) =>
      showToast({ type: 'error', title, message, duration: 0, ...options }),

    warning: (
      title: string,
      message?: string,
      options?: Partial<Notification>
    ) => showToast({ type: 'warning', title, message, ...options }),

    info: (title: string, message?: string, options?: Partial<Notification>) =>
      showToast({ type: 'info', title, message, ...options }),

    custom: (notification: Omit<Notification, 'id' | 'timestamp'>) =>
      showToast(notification),
  };

  return toast;
};

export { ToastContainer };
export default Toast;
