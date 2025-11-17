require('@testing-library/jest-dom');

// Global mock for Next.js app router APIs used in tests
jest.mock('next/navigation', () => {
  const router = {
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  };

  return {
    // Provide a working useRouter to avoid "expected app router to be mounted" and similar invariants
    useRouter: () => router,
    // Common helpers used in tests/components
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
  };
});

// Silence error reporting during tests to reduce console noise and provide a full API surface
jest.mock('@/services/error-reporting', () => {
  const mockErrorReporting = {
    initialize: jest.fn(),
    reportError: jest.fn().mockResolvedValue('test-error-id'),
    addBreadcrumb: jest.fn(),
    setUser: jest.fn(),
    clearUser: jest.fn(),
    retryStoredErrors: jest.fn(),
  };

  return {
    __esModule: true,
    default: mockErrorReporting,
    errorReporting: mockErrorReporting,
    reportError: (...args) => mockErrorReporting.reportError(...args),
    addBreadcrumb: (...args) => mockErrorReporting.addBreadcrumb(...args),
    setUser: (...args) => mockErrorReporting.setUser(...args),
    clearUser: (...args) => mockErrorReporting.clearUser(...args),
  };
});
