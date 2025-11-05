import { ApiClientError } from '@/lib/api';

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Error context interface
export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  timestamp?: string;
  buildVersion?: string;
  environment?: string;
  feature?: string;
  action?: string;
  additionalData?: Record<string, any>;
}

// Error report interface
export interface ErrorReport {
  id: string;
  error: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
    status?: number;
  };
  severity: ErrorSeverity;
  context: ErrorContext;
  fingerprint: string;
  tags: string[];
  breadcrumbs: Breadcrumb[];
}

// Breadcrumb interface for tracking user actions
export interface Breadcrumb {
  timestamp: number;
  category: 'navigation' | 'user' | 'api' | 'console' | 'error';
  message: string;
  level: 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}

// Error reporting service class
class ErrorReportingService {
  private breadcrumbs: Breadcrumb[] = [];
  private maxBreadcrumbs = 50;
  private sessionId: string;
  private userId?: string;
  private isEnabled: boolean;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isEnabled = process.env.NODE_ENV === 'production';
    this.setupGlobalErrorHandlers();
  }

  // Initialize the service with user context
  initialize(
    userId?: string,
    options?: { maxBreadcrumbs?: number; enabled?: boolean }
  ) {
    this.userId = userId;

    if (options?.maxBreadcrumbs) {
      this.maxBreadcrumbs = options.maxBreadcrumbs;
    }

    if (options?.enabled !== undefined) {
      this.isEnabled = options.enabled;
    }

    this.addBreadcrumb({
      category: 'navigation',
      message: 'Error reporting service initialized',
      level: 'info',
      data: { userId, sessionId: this.sessionId },
    });
  }

  // Add breadcrumb for tracking user actions
  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>) {
    const fullBreadcrumb: Breadcrumb = {
      ...breadcrumb,
      timestamp: Date.now(),
    };

    this.breadcrumbs.push(fullBreadcrumb);

    // Keep only the most recent breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }
  }

  // Report an error
  async reportError(
    error: Error | ApiClientError,
    context: Partial<ErrorContext> = {},
    severity?: ErrorSeverity
  ): Promise<string> {
    if (!this.isEnabled) {
      console.warn('Error reporting is disabled');
      return '';
    }

    const errorId = this.generateErrorId();
    const errorSeverity = severity || this.determineSeverity(error);
    const fingerprint = this.generateFingerprint(error);
    const tags = this.generateTags(error, context);

    const report: ErrorReport = {
      id: errorId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...(error instanceof ApiClientError && {
          code: error.code,
          status: error.status,
        }),
      },
      severity: errorSeverity,
      context: {
        ...this.getDefaultContext(),
        ...context,
      },
      fingerprint,
      tags,
      breadcrumbs: [...this.breadcrumbs],
    };

    // Add error breadcrumb
    this.addBreadcrumb({
      category: 'error',
      message: `Error reported: ${error.message}`,
      level: 'error',
      data: { errorId, severity: errorSeverity },
    });

    try {
      await this.sendReport(report);
      console.log(`Error reported with ID: ${errorId}`);
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
      // Store locally for retry
      this.storeErrorLocally(report);
    }

    return errorId;
  }

  // Report performance issues
  async reportPerformance(
    metric: string,
    value: number,
    context: Partial<ErrorContext> = {}
  ) {
    if (!this.isEnabled) return;

    const report = {
      id: this.generateErrorId(),
      type: 'performance',
      metric,
      value,
      context: {
        ...this.getDefaultContext(),
        ...context,
      },
      timestamp: Date.now(),
    };

    try {
      await this.sendPerformanceReport(report);
    } catch (error) {
      console.error('Failed to report performance metric:', error);
    }
  }

  // Set user context
  setUser(userId: string, userData?: Record<string, any>) {
    this.userId = userId;

    this.addBreadcrumb({
      category: 'user',
      message: 'User context updated',
      level: 'info',
      data: { userId, ...userData },
    });
  }

  // Clear user context (e.g., on logout)
  clearUser() {
    this.userId = undefined;

    this.addBreadcrumb({
      category: 'user',
      message: 'User context cleared',
      level: 'info',
    });
  }

  // Add custom tags
  setTags(tags: Record<string, string>) {
    this.addBreadcrumb({
      category: 'user',
      message: 'Custom tags set',
      level: 'info',
      data: tags,
    });
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate unique error ID
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Determine error severity
  private determineSeverity(error: Error | ApiClientError): ErrorSeverity {
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
          return error.status && error.status >= 500 ? 'high' : 'medium';
      }
    }

    // React/JavaScript errors
    if (error.message.includes('ChunkLoadError')) return 'high';
    if (error.message.includes('Loading chunk')) return 'high';
    if (error.name === 'TypeError') return 'medium';
    if (error.name === 'ReferenceError') return 'high';

    return 'medium';
  }

  // Generate error fingerprint for grouping
  private generateFingerprint(error: Error | ApiClientError): string {
    const key =
      error instanceof ApiClientError
        ? `${error.code}_${error.message}`
        : `${error.name}_${error.message}`;

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(36);
  }

  // Generate tags for error categorization
  private generateTags(
    error: Error | ApiClientError,
    context: Partial<ErrorContext>
  ): string[] {
    const tags: string[] = [];

    // Error type tags
    if (error instanceof ApiClientError) {
      tags.push(`api_error:${error.code}`);
      if (error.status) {
        tags.push(`status:${error.status}`);
      }
    } else {
      tags.push(`js_error:${error.name}`);
    }

    // Context tags
    if (context.feature) tags.push(`feature:${context.feature}`);
    if (context.action) tags.push(`action:${context.action}`);
    if (context.environment) tags.push(`env:${context.environment}`);

    // Browser tags
    if (typeof navigator !== 'undefined') {
      const userAgent = navigator.userAgent.toLowerCase();
      if (userAgent.includes('chrome')) tags.push('browser:chrome');
      else if (userAgent.includes('firefox')) tags.push('browser:firefox');
      else if (userAgent.includes('safari')) tags.push('browser:safari');
      else if (userAgent.includes('edge')) tags.push('browser:edge');
    }

    return tags;
  }

  // Get default context
  private getDefaultContext(): ErrorContext {
    return {
      userId: this.userId,
      sessionId: this.sessionId,
      userAgent:
        typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      timestamp: new Date().toISOString(),
      buildVersion: process.env.NEXT_PUBLIC_BUILD_VERSION || 'unknown',
      environment: process.env.NODE_ENV || 'unknown',
    };
  }

  // Send error report to monitoring service
  private async sendReport(report: ErrorReport): Promise<void> {
    // In production, send to your error monitoring service
    // Examples: Sentry, LogRocket, Bugsnag, etc.

    if (process.env.NODE_ENV === 'development') {
      console.group('🐛 Error Report');
      console.error('Error:', report.error);
      console.log('Severity:', report.severity);
      console.log('Context:', report.context);
      console.log('Breadcrumbs:', report.breadcrumbs);
      console.groupEnd();
      return;
    }

    // Example implementation for a custom error service
    const response = await fetch('/api/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(report),
    });

    if (!response.ok) {
      throw new Error(`Failed to send error report: ${response.statusText}`);
    }
  }

  // Send performance report
  private async sendPerformanceReport(report: any): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Performance Report:', report);
      return;
    }

    const response = await fetch('/api/performance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(report),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to send performance report: ${response.statusText}`
      );
    }
  }

  // Store error locally for retry
  private storeErrorLocally(report: ErrorReport): void {
    try {
      const stored = localStorage.getItem('pending_error_reports');
      const reports = stored ? JSON.parse(stored) : [];
      reports.push(report);

      // Keep only the most recent 10 reports
      const recentReports = reports.slice(-10);
      localStorage.setItem(
        'pending_error_reports',
        JSON.stringify(recentReports)
      );
    } catch (error) {
      console.error('Failed to store error locally:', error);
    }
  }

  // Retry sending stored errors
  async retryStoredErrors(): Promise<void> {
    try {
      const stored = localStorage.getItem('pending_error_reports');
      if (!stored) return;

      const reports: ErrorReport[] = JSON.parse(stored);
      const successfulReports: string[] = [];

      for (const report of reports) {
        try {
          await this.sendReport(report);
          successfulReports.push(report.id);
        } catch (error) {
          console.error(`Failed to retry error report ${report.id}:`, error);
        }
      }

      // Remove successfully sent reports
      if (successfulReports.length > 0) {
        const remainingReports = reports.filter(
          (r) => !successfulReports.includes(r.id)
        );
        localStorage.setItem(
          'pending_error_reports',
          JSON.stringify(remainingReports)
        );
      }
    } catch (error) {
      console.error('Failed to retry stored errors:', error);
    }
  }

  // Set up global error handlers
  private setupGlobalErrorHandlers(): void {
    if (typeof window === 'undefined') return;

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        { feature: 'global', action: 'unhandled_rejection' },
        'high'
      );
    });

    // Handle global JavaScript errors
    window.addEventListener('error', (event) => {
      this.reportError(
        new Error(`Global Error: ${event.message}`),
        {
          feature: 'global',
          action: 'global_error',
          additionalData: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        },
        'high'
      );
    });
  }
}

// Create singleton instance
export const errorReporting = new ErrorReportingService();

// Export convenience functions
export const reportError = (
  error: Error | ApiClientError,
  context?: Partial<ErrorContext>,
  severity?: ErrorSeverity
) => errorReporting.reportError(error, context, severity);

export const addBreadcrumb = (breadcrumb: Omit<Breadcrumb, 'timestamp'>) =>
  errorReporting.addBreadcrumb(breadcrumb);

export const setUser = (userId: string, userData?: Record<string, any>) =>
  errorReporting.setUser(userId, userData);

export const clearUser = () => errorReporting.clearUser();

export default errorReporting;
