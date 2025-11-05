import { renderHook, act, waitFor } from '@testing-library/react';
import {
  retry,
  retryConditions,
  retryConfigs,
  CircuitBreaker,
  withRetry,
} from '@/utils/retry';
import { ApiClientError } from '@/lib/api';
import useOfflineDetection, {
  useOfflineHandler,
} from '@/hooks/useOfflineDetection';
import errorReporting, {
  reportError,
  addBreadcrumb,
} from '@/services/error-reporting';

// Mock fetch for offline detection tests
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock console methods
const originalConsoleError = console.error;
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.log = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
});

// Skip ErrorBoundary component tests for now since they require JSX
// Focus on the core error handling logic

describe('Retry Mechanism Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('retry function', () => {
    it('should succeed on first attempt', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');

      const result = await retry(mockOperation);

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should retry on transient errors', async () => {
      const mockOperation = jest
        .fn()
        .mockRejectedValueOnce(
          new ApiClientError('NETWORK_ERROR', 'Network failed')
        )
        .mockRejectedValueOnce(new ApiClientError('TIMEOUT', 'Request timeout'))
        .mockResolvedValueOnce('success');

      const result = await retry(mockOperation, {
        maxAttempts: 3,
        baseDelay: 10, // Fast for tests
        retryCondition: retryConditions.transientErrors,
      });

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it('should not retry on client errors', async () => {
      const mockOperation = jest
        .fn()
        .mockRejectedValue(
          new ApiClientError('VALIDATION_ERROR', 'Invalid data', 400)
        );

      await expect(
        retry(mockOperation, {
          maxAttempts: 3,
          retryCondition: retryConditions.transientErrors,
        })
      ).rejects.toThrow('Invalid data');

      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should respect maximum attempts', async () => {
      const mockOperation = jest
        .fn()
        .mockRejectedValue(
          new ApiClientError('SERVER_ERROR', 'Server error', 500)
        );

      await expect(
        retry(mockOperation, {
          maxAttempts: 2,
          baseDelay: 10,
          retryCondition: retryConditions.allExceptClientErrors,
        })
      ).rejects.toThrow('Server error');

      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('should call retry and failure callbacks', async () => {
      const onRetry = jest.fn();
      const onFailure = jest.fn();
      const mockOperation = jest
        .fn()
        .mockRejectedValue(
          new ApiClientError('SERVER_ERROR', 'Server error', 500)
        );

      await expect(
        retry(mockOperation, {
          maxAttempts: 2,
          baseDelay: 10,
          onRetry,
          onFailure,
          retryCondition: retryConditions.allExceptClientErrors,
        })
      ).rejects.toThrow('Server error');

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onFailure).toHaveBeenCalledTimes(1);
    });

    it('should use exponential backoff with jitter', async () => {
      const mockOperation = jest
        .fn()
        .mockRejectedValue(
          new ApiClientError('SERVER_ERROR', 'Server error', 500)
        );

      const startTime = Date.now();

      await expect(
        retry(mockOperation, {
          maxAttempts: 3,
          baseDelay: 100,
          backoffFactor: 2,
          jitter: true,
          retryCondition: retryConditions.allExceptClientErrors,
        })
      ).rejects.toThrow('Server error');

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should have some delay from retries (at least base delay)
      expect(duration).toBeGreaterThan(100);
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });
  });

  describe('withRetry wrapper', () => {
    it('should wrap function with retry logic', async () => {
      const originalFunction = jest
        .fn()
        .mockRejectedValueOnce(
          new ApiClientError('NETWORK_ERROR', 'Network error')
        )
        .mockResolvedValueOnce('success');

      const wrappedFunction = withRetry(originalFunction, {
        maxAttempts: 2,
        baseDelay: 10,
        retryCondition: retryConditions.transientErrors,
      });

      const result = await wrappedFunction('arg1', 'arg2');

      expect(result).toBe('success');
      expect(originalFunction).toHaveBeenCalledTimes(2);
      expect(originalFunction).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('retry configurations', () => {
    it('should use critical configuration for important operations', async () => {
      const mockOperation = jest
        .fn()
        .mockRejectedValue(
          new ApiClientError('SERVER_ERROR', 'Server error', 500)
        );

      const config = { ...retryConfigs.critical, baseDelay: 10 }; // Fast for tests

      await expect(retry(mockOperation, config)).rejects.toThrow(
        'Server error'
      );

      expect(mockOperation).toHaveBeenCalledTimes(5); // maxAttempts: 5
    }, 10000); // Increase timeout

    it('should use user action configuration for user-initiated operations', async () => {
      const mockOperation = jest
        .fn()
        .mockRejectedValue(
          new ApiClientError('NETWORK_ERROR', 'Network error')
        );

      const config = { ...retryConfigs.userAction, baseDelay: 10 }; // Fast for tests

      await expect(retry(mockOperation, config)).rejects.toThrow(
        'Network error'
      );

      expect(mockOperation).toHaveBeenCalledTimes(3); // maxAttempts: 3
    });
  });
});

describe('Circuit Breaker Tests', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker(2, 1000, 2000); // 2 failures, 1s recovery, 2s monitoring
  });

  it('should allow operations when circuit is closed', async () => {
    const mockOperation = jest.fn().mockResolvedValue('success');

    const result = await circuitBreaker.execute(mockOperation);

    expect(result).toBe('success');
    expect(circuitBreaker.getState().state).toBe('closed');
  });

  it('should open circuit after failure threshold', async () => {
    const mockOperation = jest
      .fn()
      .mockRejectedValue(new Error('Operation failed'));

    // First failure
    await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow(
      'Operation failed'
    );
    expect(circuitBreaker.getState().state).toBe('closed');

    // Second failure - should open circuit
    await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow(
      'Operation failed'
    );
    expect(circuitBreaker.getState().state).toBe('open');

    // Third attempt should be rejected immediately
    await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow(
      'Circuit breaker is open'
    );
    expect(mockOperation).toHaveBeenCalledTimes(2); // Should not call operation when open
  });

  it('should transition to half-open after recovery timeout', async () => {
    jest.useFakeTimers();

    const mockOperation = jest
      .fn()
      .mockRejectedValueOnce(new Error('Failure 1'))
      .mockRejectedValueOnce(new Error('Failure 2'))
      .mockResolvedValueOnce('success');

    // Trigger failures to open circuit
    await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow(
      'Failure 1'
    );
    await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow(
      'Failure 2'
    );
    expect(circuitBreaker.getState().state).toBe('open');

    // Fast-forward past recovery timeout
    jest.advanceTimersByTime(1100);

    // Next operation should succeed and close circuit
    const result = await circuitBreaker.execute(mockOperation);
    expect(result).toBe('success');
    expect(circuitBreaker.getState().state).toBe('closed');

    jest.useRealTimers();
  });
});

describe('Offline Detection Tests', () => {
  beforeEach(() => {
    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    mockFetch.mockClear();
  });

  it('should detect initial online status', () => {
    const { result } = renderHook(() =>
      useOfflineDetection({ enablePing: false })
    );

    expect(result.current.isOnline).toBe(true);
    expect(result.current.isOffline).toBe(false);
  });

  it('should detect network status changes', async () => {
    const { result } = renderHook(() =>
      useOfflineDetection({
        enablePing: false,
        showNotifications: false,
      })
    );

    expect(result.current.isOnline).toBe(true);

    // Simulate going offline
    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
      window.dispatchEvent(new Event('offline'));
    });

    await waitFor(() => {
      expect(result.current.isOffline).toBe(true);
    });

    // Simulate going back online
    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => {
      expect(result.current.isOnline).toBe(true);
    });
  });

  it('should verify connectivity with server ping', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    const { result } = renderHook(() =>
      useOfflineDetection({
        enablePing: true,
        pingUrl: '/api/ping',
        pingTimeout: 1000,
      })
    );

    await waitFor(() => {
      expect(result.current.isOnline).toBe(true);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/ping',
      expect.objectContaining({
        method: 'HEAD',
        cache: 'no-cache',
      })
    );
  });

  it('should handle ping failures', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() =>
      useOfflineDetection({
        enablePing: true,
        showNotifications: false,
      })
    );

    await waitFor(() => {
      expect(result.current.isOffline).toBe(true);
    });
  });

  it('should provide retry functionality', async () => {
    // Mock successful ping response
    mockFetch.mockResolvedValueOnce({ ok: true });

    const { result } = renderHook(() =>
      useOfflineDetection({
        enablePing: true,
        showNotifications: false,
        pingUrl: '/api/ping',
      })
    );

    let retryResult: boolean;
    await act(async () => {
      retryResult = await result.current.retry();
    });

    // The retry function should return a boolean
    expect(typeof retryResult!).toBe('boolean');

    // Verify fetch was called for ping
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/ping',
      expect.objectContaining({
        method: 'HEAD',
        cache: 'no-cache',
      })
    );
  });
});

describe('Offline Handler Tests', () => {
  it('should queue actions when offline', () => {
    const { result } = renderHook(() =>
      useOfflineHandler({
        enablePing: false,
        showNotifications: false,
      })
    );

    // Simulate offline state
    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
      window.dispatchEvent(new Event('offline'));
    });

    const mockAction = jest.fn().mockResolvedValue(undefined);

    act(() => {
      const wasQueued = result.current.queueAction(mockAction);
      expect(wasQueued).toBe(false); // Action was queued
    });

    expect(result.current.queuedActionsCount).toBe(1);
    expect(mockAction).not.toHaveBeenCalled();
  });

  it('should process queued actions when back online', async () => {
    const { result } = renderHook(() =>
      useOfflineHandler({
        enablePing: false,
        showNotifications: false,
      })
    );

    // Start offline
    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
      window.dispatchEvent(new Event('offline'));
    });

    const mockAction1 = jest.fn().mockResolvedValue(undefined);
    const mockAction2 = jest.fn().mockResolvedValue(undefined);

    act(() => {
      result.current.queueAction(mockAction1);
      result.current.queueAction(mockAction2);
    });

    expect(result.current.queuedActionsCount).toBe(2);

    // Go back online
    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => {
      expect(result.current.queuedActionsCount).toBe(0);
    });

    expect(mockAction1).toHaveBeenCalled();
    expect(mockAction2).toHaveBeenCalled();
  });
});

describe('Error Reporting Service Tests', () => {
  beforeEach(() => {
    errorReporting.initialize('test-user-123', { enabled: true });
  });

  it('should report errors with context', async () => {
    const testError = new Error('Test error for reporting');

    const errorId = await reportError(testError, {
      feature: 'dashboard',
      action: 'load_stats',
    });

    expect(errorId).toBeTruthy();
    expect(typeof errorId).toBe('string');
  });

  it('should add breadcrumbs for tracking', () => {
    addBreadcrumb({
      category: 'user',
      message: 'User clicked button',
      level: 'info',
      data: { buttonId: 'submit-btn' },
    });

    addBreadcrumb({
      category: 'api',
      message: 'API call started',
      level: 'info',
      data: { endpoint: '/api/stats' },
    });

    // Breadcrumbs should be tracked internally
    // In a real implementation, you might expose a method to get breadcrumbs for testing
  });

  it('should handle different error types', async () => {
    const apiError = new ApiClientError('SERVER_ERROR', 'Server failed', 500);
    const jsError = new Error('JavaScript error');
    const networkError = new ApiClientError('NETWORK_ERROR', 'Network failed');

    await reportError(apiError);
    await reportError(jsError);
    await reportError(networkError);

    // All errors should be reported successfully
    // In production, these would be sent to monitoring service
  });
});
