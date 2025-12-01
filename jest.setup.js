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

// Mock Canvas API
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: jest.fn(() => {
    return {
      drawImage: jest.fn(),
      toDataURL: jest.fn(() => 'data:image/jpeg;base64,mocked'),
    };
  }),
  writable: true,
});

Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
  value: jest.fn(() => 'data:image/jpeg;base64,mocked'),
  writable: true,
});

Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
  value: jest.fn((callback) => {
    callback(new Blob(['mocked'], { type: 'image/jpeg' }));
  }),
  writable: true,
});

// Mock Image API
// We need to ensure onload is triggered when src is set
const originalImage = global.Image;
global.Image = class extends originalImage {
  constructor() {
    super();
    // We can't easily hook into the native src setter in jsdom's Image implementation
    // so we'll use a property definition to intercept it
    let src = '';
    Object.defineProperty(this, 'src', {
      get() {
        return src;
      },
      set(value) {
        src = value;
        // Simulate loading synchronously for tests
        if (this.onload) {
          this.onload();
        }
      },
    });
  }
};
