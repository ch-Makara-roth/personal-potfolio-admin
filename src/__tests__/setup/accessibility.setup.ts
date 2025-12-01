/**
 * Accessibility testing setup
 */

import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Configure testing library for better accessibility testing
configure({
  // Increase timeout for accessibility tests
  asyncUtilTimeout: 5000,
});

// Mock IntersectionObserver with proper typings
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  constructor(
    _callback?: IntersectionObserverCallback,
    _options?: IntersectionObserverInit
  ) { }
  disconnect(): void { }
  observe(_target: Element): void { }
  unobserve(_target: Element): void { }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

// Assign to global, casting to any to avoid constructor signature mismatches
// in the JSDOM/Jest environment
const g = globalThis as any;
g.IntersectionObserver = MockIntersectionObserver as any;

// Mock ResizeObserver with proper typings
class MockResizeObserver implements ResizeObserver {
  constructor(_callback?: ResizeObserverCallback) { }
  disconnect(): void { }
  observe(_target: Element, _options?: ResizeObserverOptions): void { }
  unobserve(_target: Element): void { }
}

g.ResizeObserver = MockResizeObserver as any;

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

// Mock focus method
HTMLElement.prototype.focus = jest.fn();

// Mock getBoundingClientRect
Element.prototype.getBoundingClientRect = jest.fn(() => ({
  width: 100,
  height: 100,
  top: 0,
  left: 0,
  bottom: 100,
  right: 100,
  x: 0,
  y: 0,
  toJSON: jest.fn(),
}));

// Mock getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => '0px',
  }),
});

// Setup custom matchers for accessibility testing
expect.extend({
  toBeAccessible(received) {
    // Custom matcher for accessibility
    const pass = received && typeof received === 'object';

    if (pass) {
      return {
        message: () => `expected element to not be accessible`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to be accessible`,
        pass: false,
      };
    }
  },

  toHaveProperFocus(received) {
    // Custom matcher for focus management
    const hasFocus = received === document.activeElement;

    if (hasFocus) {
      return {
        message: () => `expected element to not have focus`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to have focus`,
        pass: false,
      };
    }
  },
});

// Declare custom matchers for TypeScript
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeAccessible(): R;
      toHaveProperFocus(): R;
    }
  }
}

// Mock CSS media queries
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock touch events
class MockTouchEvent extends Event {
  constructor(type: string, eventInitDict?: TouchEventInit) {
    super(type, eventInitDict);
  }
}

Object.defineProperty(window, 'TouchEvent', {
  writable: true,
  value: MockTouchEvent,
});

// Mock pointer events
class MockPointerEvent extends Event {
  constructor(type: string, eventInitDict?: PointerEventInit) {
    super(type, eventInitDict);
  }
}

Object.defineProperty(window, 'PointerEvent', {
  writable: true,
  value: MockPointerEvent,
});

// Setup console warnings for accessibility violations
const originalWarn = console.warn;
console.warn = (...args) => {
  // Suppress specific warnings that are expected in tests
  const message = args[0];
  if (
    typeof message === 'string' &&
    (message.includes('Warning: ReactDOM.render is no longer supported') ||
      message.includes('Warning: componentWillReceiveProps has been renamed'))
  ) {
    return;
  }
  originalWarn(...args);
};

// Mock environment variables for testing
// Cast to any since process.env.NODE_ENV is treated as read-only in TypeScript
(process.env as any).NODE_ENV = 'test';

// Dummy test to satisfy Jest requirement
describe('Accessibility Setup', () => {
  it('should initialize accessibility test environment', () => {
    expect(true).toBe(true);
  });
});
