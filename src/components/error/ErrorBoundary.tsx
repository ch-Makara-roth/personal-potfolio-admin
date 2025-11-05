import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ApiClientError } from '@/lib/api';
import {
  useNotificationStore,
  createErrorNotification,
} from '@/stores/notification-store';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  level?: 'page' | 'component' | 'global';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report error to monitoring service (in production)
    this.reportError(error, errorInfo);

    // Show notification for component-level errors
    if (this.props.level === 'component') {
      const addNotification = useNotificationStore.getState().addNotification;
      addNotification(
        createErrorNotification(
          'Component Error',
          'A component encountered an error and has been reset.'
        )
      );
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // In production, send error to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Sentry, LogRocket, or custom error service
      console.log('Reporting error to monitoring service:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorId: this.state.errorId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      });
    }
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
      });
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private getErrorMessage = (error: Error): string => {
    if (error instanceof ApiClientError) {
      switch (error.code) {
        case 'NETWORK_ERROR':
          return 'Unable to connect to the server. Please check your internet connection.';
        case 'TIMEOUT':
          return 'The request took too long to complete. Please try again.';
        case 'SERVER_ERROR':
          return 'The server encountered an error. Please try again later.';
        case 'AUTHORIZATION_ERROR':
          return 'You are not authorized to perform this action.';
        case 'VALIDATION_ERROR':
          return 'The data provided is invalid. Please check your input.';
        default:
          return error.message || 'An unexpected error occurred.';
      }
    }

    // Handle common React errors
    if (error.message.includes('ChunkLoadError')) {
      return 'Failed to load application resources. Please refresh the page.';
    }

    if (error.message.includes('Loading chunk')) {
      return 'Failed to load part of the application. Please refresh the page.';
    }

    return error.message || 'An unexpected error occurred.';
  };

  private getErrorSeverity = (
    error: Error
  ): 'low' | 'medium' | 'high' | 'critical' => {
    if (error instanceof ApiClientError) {
      switch (error.code) {
        case 'NETWORK_ERROR':
        case 'TIMEOUT':
          return 'medium';
        case 'SERVER_ERROR':
          return 'high';
        case 'AUTHORIZATION_ERROR':
          return 'medium';
        case 'VALIDATION_ERROR':
          return 'low';
        default:
          return 'medium';
      }
    }

    // React errors are usually critical
    if (
      error.message.includes('ChunkLoadError') ||
      error.message.includes('Loading chunk')
    ) {
      return 'high';
    }

    return 'critical';
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage = this.getErrorMessage(this.state.error);
      const severity = this.getErrorSeverity(this.state.error);
      const canRetry = this.retryCount < this.maxRetries;
      const isComponentLevel = this.props.level === 'component';

      return (
        <div
          className={`error-boundary ${isComponentLevel ? 'p-4' : 'min-h-screen flex items-center justify-center p-4'}`}
        >
          <Card className="max-w-lg w-full">
            <div className="p-6 text-center">
              <div
                className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                  severity === 'critical'
                    ? 'bg-red-100 text-red-600'
                    : severity === 'high'
                      ? 'bg-orange-100 text-orange-600'
                      : severity === 'medium'
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-blue-100 text-blue-600'
                }`}
              >
                <AlertTriangle className="w-6 h-6" />
              </div>

              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {isComponentLevel ? 'Component Error' : 'Something went wrong'}
              </h2>

              <p className="text-gray-600 mb-6">{errorMessage}</p>

              {this.props.showDetails && this.state.errorInfo && (
                <details className="text-left mb-6 p-4 bg-gray-50 rounded-lg">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                    <Bug className="inline w-4 h-4 mr-1" />
                    Error Details
                  </summary>
                  <div className="text-xs text-gray-600 space-y-2">
                    <div>
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    <div>
                      <strong>Error ID:</strong> {this.state.errorId}
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong>Stack Trace:</strong>
                        <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {canRetry && (
                  <Button
                    onClick={this.handleRetry}
                    variant="primary"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again ({this.maxRetries - this.retryCount} left)
                  </Button>
                )}

                {!isComponentLevel && (
                  <>
                    <Button
                      onClick={this.handleReload}
                      variant="secondary"
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Reload Page
                    </Button>

                    <Button
                      onClick={this.handleGoHome}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Home className="w-4 h-4" />
                      Go Home
                    </Button>
                  </>
                )}
              </div>

              {this.state.errorId && (
                <p className="text-xs text-gray-500 mt-4">
                  Error ID: {this.state.errorId}
                </p>
              )}
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps} level="component">
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Hook for programmatic error reporting
export const useErrorReporting = () => {
  const addNotification = useNotificationStore(
    (state) => state.addNotification
  );

  const reportError = React.useCallback(
    (error: Error, context?: string) => {
      console.error('Manual error report:', error, context);

      // Show user notification
      addNotification(
        createErrorNotification('An error occurred', context || error.message)
      );

      // Report to monitoring service in production
      if (process.env.NODE_ENV === 'production') {
        console.log('Reporting error to monitoring service:', {
          error: error.message,
          stack: error.stack,
          context,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        });
      }
    },
    [addNotification]
  );

  return { reportError };
};

export default ErrorBoundary;
