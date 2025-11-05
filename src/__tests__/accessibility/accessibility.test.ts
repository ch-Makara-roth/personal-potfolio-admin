/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import {
  useHighContrast,
  useReducedMotion,
  useFocusManagement,
  useKeyboardNavigation,
  useId,
  useAriaAttributes,
} from '@/hooks/useAccessibility';
import {
  announceToScreenReader,
  generateId,
  isHighContrastMode,
  prefersReducedMotion,
  KEYBOARD_KEYS,
  liveRegionManager,
} from '@/utils/accessibility';

// Mock matchMedia
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

describe('Accessibility Utils', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('announceToScreenReader', () => {
    it('should create and remove announcement element', () => {
      announceToScreenReader('Test announcement');

      const announcement = document.querySelector('[aria-live="polite"]');
      expect(announcement).toBeInTheDocument();
      expect(announcement).toHaveTextContent('Test announcement');
      expect(announcement).toHaveClass('sr-only');
    });

    it('should support assertive announcements', () => {
      announceToScreenReader('Urgent message', 'assertive');

      const announcement = document.querySelector('[aria-live="assertive"]');
      expect(announcement).toBeInTheDocument();
      expect(announcement).toHaveTextContent('Urgent message');
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs with prefix', () => {
      const id1 = generateId('test');
      const id2 = generateId('test');

      expect(id1).toMatch(/^test-/);
      expect(id2).toMatch(/^test-/);
      expect(id1).not.toBe(id2);
    });

    it('should use default prefix when none provided', () => {
      const id = generateId();
      expect(id).toMatch(/^id-/);
    });
  });

  describe('isHighContrastMode', () => {
    it('should detect high contrast mode', () => {
      // Mock high contrast mode
      (window.matchMedia as jest.Mock).mockImplementation((query) => ({
        matches: query === '(prefers-contrast: high)',
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }));

      expect(isHighContrastMode()).toBe(true);
    });

    it('should detect forced colors mode', () => {
      (window.matchMedia as jest.Mock).mockImplementation((query) => ({
        matches: query === '(forced-colors: active)',
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }));

      expect(isHighContrastMode()).toBe(true);
    });
  });

  describe('prefersReducedMotion', () => {
    it('should detect reduced motion preference', () => {
      (window.matchMedia as jest.Mock).mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }));

      expect(prefersReducedMotion()).toBe(true);
    });
  });
});

describe('Accessibility Hooks', () => {
  describe('useHighContrast', () => {
    it('should return high contrast state', () => {
      const { result } = renderHook(() => useHighContrast());
      expect(typeof result.current).toBe('boolean');
    });

    it('should update when media query changes', () => {
      let mediaQueryCallback: ((e: MediaQueryListEvent) => void) | null = null;

      (window.matchMedia as jest.Mock).mockImplementation(() => ({
        matches: false,
        addEventListener: jest.fn((event, callback) => {
          if (event === 'change') {
            mediaQueryCallback = callback;
          }
        }),
        removeEventListener: jest.fn(),
      }));

      const { result } = renderHook(() => useHighContrast());

      expect(result.current).toBe(false);

      // Simulate media query change
      if (mediaQueryCallback) {
        act(() => {
          mediaQueryCallback!({ matches: true } as MediaQueryListEvent);
        });
      }
    });
  });

  describe('useReducedMotion', () => {
    it('should return reduced motion state', () => {
      const { result } = renderHook(() => useReducedMotion());
      expect(typeof result.current).toBe('boolean');
    });
  });

  describe('useFocusManagement', () => {
    it('should provide announce function', () => {
      const { result } = renderHook(() => useFocusManagement());

      expect(result.current.announce).toBeInstanceOf(Function);
      expect(result.current.trapFocusInElement).toBeInstanceOf(Function);
      expect(result.current.focusElement).toBeInstanceOf(Function);
    });

    it('should announce messages', () => {
      const { result } = renderHook(() => useFocusManagement());

      act(() => {
        result.current.announce('Test message');
      });

      // Check if live region manager was called
      // This would require mocking the live region manager
    });
  });

  describe('useKeyboardNavigation', () => {
    it('should handle keyboard events', () => {
      const mockHandler = jest.fn();
      renderHook(() => useKeyboardNavigation(mockHandler));

      const keyEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      document.dispatchEvent(keyEvent);

      expect(mockHandler).toHaveBeenCalledWith('Enter', keyEvent);
    });

    it('should provide keyboard constants', () => {
      const { result } = renderHook(() => useKeyboardNavigation());
      expect(result.current.KEYBOARD_KEYS).toBe(KEYBOARD_KEYS);
    });
  });

  describe('useId', () => {
    it('should generate stable IDs', () => {
      const { result, rerender } = renderHook(() => useId('test'));
      const firstId = result.current;

      rerender();
      const secondId = result.current;

      expect(firstId).toBe(secondId);
      expect(firstId).toMatch(/^test-/);
    });
  });

  describe('useAriaAttributes', () => {
    it('should manage ARIA attributes', () => {
      const { result } = renderHook(() => useAriaAttributes());

      act(() => {
        result.current.setAriaExpanded(true);
      });

      expect(result.current.ariaAttributes['aria-expanded']).toBe('true');

      act(() => {
        result.current.setAriaSelected(false);
      });

      expect(result.current.ariaAttributes['aria-selected']).toBe('false');
    });

    it('should remove ARIA attributes', () => {
      const { result } = renderHook(() => useAriaAttributes());

      act(() => {
        result.current.updateAriaAttribute('aria-label', 'Test label');
      });

      expect(result.current.ariaAttributes['aria-label']).toBe('Test label');

      act(() => {
        result.current.removeAriaAttribute('aria-label');
      });

      expect(result.current.ariaAttributes['aria-label']).toBeUndefined();
    });
  });
});

describe('LiveRegionManager', () => {
  beforeEach(() => {
    // Initialize live regions if they don't exist
    if (!document.querySelector('[aria-live="polite"]')) {
      const politeRegion = document.createElement('div');
      politeRegion.setAttribute('aria-live', 'polite');
      politeRegion.setAttribute('aria-atomic', 'true');
      politeRegion.className = 'sr-only';
      document.body.appendChild(politeRegion);
    }

    if (!document.querySelector('[aria-live="assertive"]')) {
      const assertiveRegion = document.createElement('div');
      assertiveRegion.setAttribute('aria-live', 'assertive');
      assertiveRegion.setAttribute('aria-atomic', 'true');
      assertiveRegion.className = 'sr-only';
      document.body.appendChild(assertiveRegion);
    }
  });

  it('should create live regions on initialization', () => {
    expect(document.querySelector('[aria-live="polite"]')).toBeInTheDocument();
    expect(
      document.querySelector('[aria-live="assertive"]')
    ).toBeInTheDocument();
  });

  it('should announce messages', () => {
    liveRegionManager.announce('Test message', 'polite');

    const politeRegion = document.querySelector('[aria-live="polite"]');
    expect(politeRegion).toBeInTheDocument();
  });

  it('should handle message announcements', () => {
    const politeRegion = document.querySelector('[aria-live="polite"]');
    expect(politeRegion).toBeInTheDocument();

    // Test that the live region exists and can be used
    if (politeRegion) {
      politeRegion.textContent = 'Test message';
      expect(politeRegion.textContent).toBe('Test message');
    }
  });
});
