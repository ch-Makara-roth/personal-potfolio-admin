import { ApiClientError } from '@/lib/api';

// Retry configuration interface
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // in milliseconds
  maxDelay: number; // in milliseconds
  backoffFactor: number;
  jitter: boolean;
  retryCondition?: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number) => void;
  onFailure?: (error: unknown, totalAttempts: number) => void;
}

// Default retry configuration
export const defaultRetryConfig: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffFactor: 2,
  jitter: true,
};

// Retry condition functions
export const retryConditions = {
  // Retry on network errors and server errors (5xx)
  networkAndServerErrors: (error: unknown): boolean => {
    if (error instanceof ApiClientError) {
      return (
        error.code === 'NETWORK_ERROR' ||
        error.code === 'TIMEOUT' ||
        error.code === 'SERVER_ERROR' ||
        (error.status !== undefined && error.status >= 500)
      );
    }
    return false;
  },

  // Retry on transient errors (network, timeout, rate limit)
  transientErrors: (error: unknown): boolean => {
    if (error instanceof ApiClientError) {
      return (
        error.code === 'NETWORK_ERROR' ||
        error.code === 'TIMEOUT' ||
        error.status === 429 || // Rate limit
        error.status === 502 || // Bad Gateway
        error.status === 503 || // Service Unavailable
        error.status === 504 // Gateway Timeout
      );
    }
    return false;
  },

  // Retry on all errors except client errors (4xx except 408, 429)
  allExceptClientErrors: (error: unknown): boolean => {
    if (error instanceof ApiClientError && error.status) {
      // Don't retry on client errors except timeout (408) and rate limit (429)
      if (error.status >= 400 && error.status < 500) {
        return error.status === 408 || error.status === 429;
      }
    }
    return true;
  },

  // Never retry
  never: (): boolean => false,

  // Always retry
  always: (): boolean => true,
};

// Calculate delay with exponential backoff and optional jitter
export const calculateDelay = (
  attempt: number,
  baseDelay: number,
  backoffFactor: number,
  maxDelay: number,
  jitter: boolean = true
): number => {
  const exponentialDelay = Math.min(
    baseDelay * Math.pow(backoffFactor, attempt - 1),
    maxDelay
  );

  if (!jitter) {
    return exponentialDelay;
  }

  // Add jitter to prevent thundering herd problem
  const jitterAmount = exponentialDelay * 0.1; // 10% jitter
  const jitterOffset = (Math.random() - 0.5) * 2 * jitterAmount;

  return Math.max(0, exponentialDelay + jitterOffset);
};

// Generic retry function
export async function retry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig: RetryConfig = { ...defaultRetryConfig, ...config };

  let lastError: unknown;

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      const shouldRetry = finalConfig.retryCondition
        ? finalConfig.retryCondition(error, attempt)
        : retryConditions.transientErrors(error);

      // Don't retry if this is the last attempt or if retry condition fails
      if (attempt === finalConfig.maxAttempts || !shouldRetry) {
        break;
      }

      // Call retry callback if provided
      if (finalConfig.onRetry) {
        finalConfig.onRetry(error, attempt);
      }

      // Calculate delay and wait
      const delay = calculateDelay(
        attempt,
        finalConfig.baseDelay,
        finalConfig.backoffFactor,
        finalConfig.maxDelay,
        finalConfig.jitter
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // Call failure callback if provided
  if (finalConfig.onFailure) {
    finalConfig.onFailure(lastError, finalConfig.maxAttempts);
  }

  throw lastError;
}

// Retry wrapper for API calls
export const withRetry = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  config: Partial<RetryConfig> = {}
) => {
  return (...args: T): Promise<R> => {
    return retry(() => fn(...args), config);
  };
};

// Retry hook for React components
export const useRetry = () => {
  const retryOperation = async <T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> => {
    return retry(operation, {
      ...config,
      onRetry: (error, attempt) => {
        console.log(`Retry attempt ${attempt}:`, error);
        config.onRetry?.(error, attempt);
      },
      onFailure: (error, totalAttempts) => {
        console.error(
          `Operation failed after ${totalAttempts} attempts:`,
          error
        );
        config.onFailure?.(error, totalAttempts);
      },
    });
  };

  return { retryOperation };
};

// Specific retry configurations for common scenarios
export const retryConfigs = {
  // For critical operations that must succeed
  critical: {
    maxAttempts: 5,
    baseDelay: 1000,
    maxDelay: 60000,
    backoffFactor: 2,
    jitter: true,
    retryCondition: retryConditions.allExceptClientErrors,
  } as Partial<RetryConfig>,

  // For user-initiated actions
  userAction: {
    maxAttempts: 3,
    baseDelay: 500,
    maxDelay: 10000,
    backoffFactor: 2,
    jitter: true,
    retryCondition: retryConditions.transientErrors,
  } as Partial<RetryConfig>,

  // For background operations
  background: {
    maxAttempts: 5,
    baseDelay: 2000,
    maxDelay: 120000,
    backoffFactor: 2.5,
    jitter: true,
    retryCondition: retryConditions.networkAndServerErrors,
  } as Partial<RetryConfig>,

  // For real-time data fetching
  realtime: {
    maxAttempts: 2,
    baseDelay: 200,
    maxDelay: 2000,
    backoffFactor: 2,
    jitter: false,
    retryCondition: retryConditions.transientErrors,
  } as Partial<RetryConfig>,

  // For file uploads
  upload: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffFactor: 3,
    jitter: true,
    retryCondition: (error: unknown) => {
      if (error instanceof ApiClientError) {
        // Don't retry on file too large or unsupported format
        if (error.status === 413 || error.status === 415) {
          return false;
        }
      }
      return retryConditions.transientErrors(error);
    },
  } as Partial<RetryConfig>,
};

// Circuit breaker pattern for preventing cascading failures
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private failureThreshold: number = 5,
    private recoveryTimeout: number = 60000, // 1 minute
    private monitoringPeriod: number = 120000 // 2 minutes
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'half-open';
      } else {
        throw new ApiClientError(
          'CIRCUIT_BREAKER_OPEN',
          'Circuit breaker is open'
        );
      }
    }

    try {
      const result = await operation();

      if (this.state === 'half-open') {
        this.reset();
      }

      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
    }

    // Reset failure count after monitoring period
    setTimeout(() => {
      if (Date.now() - this.lastFailureTime > this.monitoringPeriod) {
        this.failures = 0;
      }
    }, this.monitoringPeriod);
  }

  private reset(): void {
    this.failures = 0;
    this.state = 'closed';
    this.lastFailureTime = 0;
  }

  getState(): { state: string; failures: number; lastFailureTime: number } {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
    };
  }
}

// Global circuit breaker instances for different services
export const circuitBreakers = {
  api: new CircuitBreaker(5, 60000, 120000),
  upload: new CircuitBreaker(3, 30000, 60000),
  analytics: new CircuitBreaker(10, 120000, 300000),
};

// Utility function to wrap operations with circuit breaker
export const withCircuitBreaker = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  circuitBreaker: CircuitBreaker
) => {
  return (...args: T): Promise<R> => {
    return circuitBreaker.execute(() => fn(...args));
  };
};
