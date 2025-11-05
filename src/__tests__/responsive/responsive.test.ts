/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import {
  useBreakpoint,
  useTouch,
  useViewport,
  useMobileFocus,
  useResponsiveGrid,
  useResponsiveSpacing,
  useTouchFriendly,
  useResponsiveText,
  useOrientation,
} from '@/hooks/useResponsive';

// Mock window properties
const mockWindowProperties = (
  width: number,
  height: number,
  touchPoints: number = 0
) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });

  Object.defineProperty(navigator, 'maxTouchPoints', {
    writable: true,
    configurable: true,
    value: touchPoints,
  });

  // Mock ontouchstart
  if (touchPoints > 0) {
    Object.defineProperty(window, 'ontouchstart', {
      writable: true,
      configurable: true,
      value: {},
    });
  } else {
    delete (window as any).ontouchstart;
  }
};

// Mock matchMedia for reduced motion
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: query === '(prefers-reduced-motion: reduce)',
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('Responsive Hooks', () => {
  describe('useBreakpoint', () => {
    it('should detect mobile breakpoint', () => {
      mockWindowProperties(500, 800);

      const { result } = renderHook(() => useBreakpoint());

      expect(result.current.current).toBe('sm');
      expect(result.current.isMobile).toBe(true);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(false);
      expect(result.current.isSmallScreen).toBe(true);
    });

    it('should detect tablet breakpoint', () => {
      mockWindowProperties(800, 600);

      const { result } = renderHook(() => useBreakpoint());

      expect(result.current.current).toBe('lg');
      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(true);
      expect(result.current.isSmallScreen).toBe(false);
    });

    it('should detect desktop breakpoint', () => {
      mockWindowProperties(1200, 800);

      const { result } = renderHook(() => useBreakpoint());

      expect(result.current.current).toBe('xl');
      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(true);
      expect(result.current.isSmallScreen).toBe(false);
    });

    it('should update on window resize', () => {
      mockWindowProperties(500, 800);

      const { result } = renderHook(() => useBreakpoint());

      expect(result.current.current).toBe('sm');

      // Simulate window resize
      mockWindowProperties(1200, 800);

      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      expect(result.current.current).toBe('xl');
    });
  });

  describe('useTouch', () => {
    it('should detect touch device by maxTouchPoints', () => {
      mockWindowProperties(800, 600, 5);

      const { result } = renderHook(() => useTouch());

      expect(result.current).toBe(true);
    });

    it('should detect non-touch device', () => {
      mockWindowProperties(1200, 800, 0);

      const { result } = renderHook(() => useTouch());

      expect(result.current).toBe(false);
    });

    it('should update on first touch event', () => {
      mockWindowProperties(1200, 800, 0);

      const { result } = renderHook(() => useTouch());

      expect(result.current).toBe(false);

      // Simulate first touch
      act(() => {
        window.dispatchEvent(new TouchEvent('touchstart'));
      });

      expect(result.current).toBe(true);
    });
  });

  describe('useViewport', () => {
    it('should return current viewport dimensions', () => {
      mockWindowProperties(1024, 768);

      const { result } = renderHook(() => useViewport());

      expect(result.current.width).toBe(1024);
      expect(result.current.height).toBe(768);
    });

    it('should update on window resize', () => {
      mockWindowProperties(800, 600);

      const { result } = renderHook(() => useViewport());

      expect(result.current.width).toBe(800);
      expect(result.current.height).toBe(600);

      // Simulate resize
      mockWindowProperties(1200, 900);

      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      expect(result.current.width).toBe(1200);
      expect(result.current.height).toBe(900);
    });
  });

  describe('useMobileFocus', () => {
    it('should provide focusElement function', () => {
      const { result } = renderHook(() => useMobileFocus());

      expect(result.current.focusElement).toBeInstanceOf(Function);
    });

    it('should handle mobile focus with scrollIntoView', () => {
      mockWindowProperties(500, 800); // Mobile size

      const mockElement = {
        focus: jest.fn(),
        scrollIntoView: jest.fn(),
      } as unknown as HTMLElement;

      const { result } = renderHook(() => useMobileFocus());

      act(() => {
        result.current.focusElement(mockElement);
      });

      expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'auto',
        block: 'center',
        inline: 'nearest',
      });
    });
  });

  describe('useResponsiveGrid', () => {
    it('should return appropriate columns for mobile', () => {
      mockWindowProperties(500, 800);

      const { result } = renderHook(() => useResponsiveGrid(3));

      expect(result.current.columns).toBe(1);
    });

    it('should return appropriate columns for tablet', () => {
      mockWindowProperties(800, 600);

      const { result } = renderHook(() => useResponsiveGrid(3));

      expect(result.current.columns).toBe(3);
    });

    it('should return appropriate columns for desktop', () => {
      mockWindowProperties(1200, 800);

      const { result } = renderHook(() => useResponsiveGrid(3));

      expect(result.current.columns).toBe(3);
    });

    it('should respect maxColumns limit', () => {
      mockWindowProperties(1200, 800);

      const { result } = renderHook(() => useResponsiveGrid(2));

      expect(result.current.columns).toBe(2);
    });
  });

  describe('useResponsiveSpacing', () => {
    it('should return appropriate spacing classes', () => {
      mockWindowProperties(500, 800); // Mobile

      const { result } = renderHook(() => useResponsiveSpacing());

      expect(result.current.getSpacing('md')).toBe('space-y-4');
      expect(result.current.getPadding()).toBe('p-4');
    });

    it('should return desktop spacing classes', () => {
      mockWindowProperties(1200, 800); // Desktop

      const { result } = renderHook(() => useResponsiveSpacing());

      expect(result.current.getSpacing('md')).toBe('space-y-8');
      expect(result.current.getPadding()).toBe('p-8');
    });
  });

  describe('useTouchFriendly', () => {
    it('should return larger sizes for touch devices', () => {
      mockWindowProperties(500, 800, 5); // Mobile with touch

      const { result } = renderHook(() => useTouchFriendly());

      expect(result.current.getTouchSize('p-2')).toBe('p-3');
      expect(result.current.getTouchSize('h-8')).toBe('h-10');
      expect(result.current.getMinTouchTarget()).toBe('min-h-11 min-w-11');
      expect(result.current.isTouch).toBe(true);
    });

    it('should return original sizes for non-touch devices', () => {
      mockWindowProperties(1200, 800, 0); // Desktop without touch

      const { result } = renderHook(() => useTouchFriendly());

      expect(result.current.getTouchSize('p-2')).toBe('p-2');
      expect(result.current.getTouchSize('h-8')).toBe('h-8');
      expect(result.current.getMinTouchTarget()).toBe('min-h-8 min-w-8');
      expect(result.current.isTouch).toBe(false);
    });
  });

  describe('useResponsiveText', () => {
    it('should return appropriate text sizes for mobile', () => {
      mockWindowProperties(500, 800);

      const { result } = renderHook(() => useResponsiveText());

      expect(result.current.getTextSize('text-sm')).toBe('text-sm');
      expect(result.current.getTextSize('text-lg')).toBe('text-lg');
    });

    it('should return larger text sizes for desktop', () => {
      mockWindowProperties(1200, 800);

      const { result } = renderHook(() => useResponsiveText());

      expect(result.current.getTextSize('text-sm')).toBe('text-base');
      expect(result.current.getTextSize('text-lg')).toBe('text-xl');
    });
  });

  describe('useOrientation', () => {
    it('should detect portrait orientation', () => {
      mockWindowProperties(500, 800); // Height > Width

      const { result } = renderHook(() => useOrientation());

      expect(result.current).toBe('portrait');
    });

    it('should detect landscape orientation', () => {
      mockWindowProperties(800, 500); // Width > Height

      const { result } = renderHook(() => useOrientation());

      expect(result.current).toBe('landscape');
    });

    it('should update on orientation change', () => {
      mockWindowProperties(500, 800); // Portrait

      const { result } = renderHook(() => useOrientation());

      expect(result.current).toBe('portrait');

      // Simulate orientation change
      mockWindowProperties(800, 500); // Landscape

      act(() => {
        window.dispatchEvent(new Event('orientationchange'));
      });

      expect(result.current).toBe('landscape');
    });
  });
});
