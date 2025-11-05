import { useState, useEffect, useCallback } from 'react';
import { useReducedMotion } from './useAccessibility';

// Breakpoint definitions
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

// Hook for detecting current breakpoint
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(() => {
    if (typeof window === 'undefined') return 'lg';

    const width = window.innerWidth;
    if (width < BREAKPOINTS.sm) return 'sm';
    if (width < BREAKPOINTS.md) return 'md';
    if (width < BREAKPOINTS.lg) return 'lg';
    if (width < BREAKPOINTS.xl) return 'xl';
    return '2xl';
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      let newBreakpoint: Breakpoint;

      if (width < BREAKPOINTS.sm) newBreakpoint = 'sm';
      else if (width < BREAKPOINTS.md) newBreakpoint = 'md';
      else if (width < BREAKPOINTS.lg) newBreakpoint = 'lg';
      else if (width < BREAKPOINTS.xl) newBreakpoint = 'xl';
      else newBreakpoint = '2xl';

      if (newBreakpoint !== breakpoint) {
        setBreakpoint(newBreakpoint);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return {
    current: breakpoint,
    isMobile: breakpoint === 'sm',
    isTablet: breakpoint === 'md',
    isDesktop: ['lg', 'xl', '2xl'].includes(breakpoint),
    isSmallScreen: ['sm', 'md'].includes(breakpoint),
  };
};

// Hook for touch detection
export const useTouch = () => {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };

    checkTouch();

    // Listen for first touch to confirm touch device
    const handleFirstTouch = () => {
      setIsTouch(true);
      window.removeEventListener('touchstart', handleFirstTouch);
    };

    window.addEventListener('touchstart', handleFirstTouch, { once: true });

    return () => {
      window.removeEventListener('touchstart', handleFirstTouch);
    };
  }, []);

  return isTouch;
};

// Hook for viewport dimensions
export const useViewport = () => {
  const [viewport, setViewport] = useState(() => {
    if (typeof window === 'undefined') {
      return { width: 1024, height: 768 };
    }
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  });

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return viewport;
};

// Hook for mobile-friendly focus management
export const useMobileFocus = () => {
  const { isMobile } = useBreakpoint();
  const isTouch = useTouch();
  const shouldReduceMotion = useReducedMotion();

  const focusElement = useCallback(
    (
      element: HTMLElement | null,
      options?: {
        preventScroll?: boolean;
        scrollIntoView?: boolean;
      }
    ) => {
      if (!element) return;

      const { preventScroll = false, scrollIntoView = true } = options || {};

      // On mobile/touch devices, handle scrolling carefully
      if ((isMobile || isTouch) && scrollIntoView && !preventScroll) {
        element.scrollIntoView({
          behavior: shouldReduceMotion ? 'auto' : 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      }

      // Small delay to ensure scrolling completes before focusing
      setTimeout(
        () => {
          element.focus({ preventScroll });
        },
        shouldReduceMotion ? 0 : 100
      );
    },
    [isMobile, isTouch, shouldReduceMotion]
  );

  return { focusElement };
};

// Hook for responsive grid columns
export const useResponsiveGrid = (maxColumns: number = 3) => {
  const { current } = useBreakpoint();

  const getColumns = useCallback(() => {
    const columnMap = {
      sm: 1,
      md: Math.min(2, maxColumns),
      lg: Math.min(3, maxColumns),
      xl: maxColumns,
      '2xl': maxColumns,
    };

    return columnMap[current];
  }, [current, maxColumns]);

  return {
    columns: getColumns(),
    gridClasses: `grid-cols-1 md:grid-cols-${Math.min(2, maxColumns)} lg:grid-cols-${Math.min(3, maxColumns)} xl:grid-cols-${maxColumns}`,
  };
};

// Hook for responsive spacing
export const useResponsiveSpacing = () => {
  const { current } = useBreakpoint();

  const getSpacing = useCallback(
    (size: 'sm' | 'md' | 'lg' = 'md') => {
      const spacingMap = {
        sm: {
          sm: 'space-y-2',
          md: 'space-y-3',
          lg: 'space-y-4',
          xl: 'space-y-4',
          '2xl': 'space-y-4',
        },
        md: {
          sm: 'space-y-4',
          md: 'space-y-6',
          lg: 'space-y-6',
          xl: 'space-y-8',
          '2xl': 'space-y-8',
        },
        lg: {
          sm: 'space-y-6',
          md: 'space-y-8',
          lg: 'space-y-10',
          xl: 'space-y-12',
          '2xl': 'space-y-12',
        },
      };

      return spacingMap[size][current];
    },
    [current]
  );

  const getPadding = useCallback(() => {
    const paddingMap = {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-6',
      xl: 'p-8',
      '2xl': 'p-8',
    };

    return paddingMap[current];
  }, [current]);

  return { getSpacing, getPadding };
};

// Hook for touch-friendly sizing
export const useTouchFriendly = () => {
  const isTouch = useTouch();
  const { isMobile } = useBreakpoint();

  const getTouchSize = useCallback(
    (baseSize: string) => {
      if (!isTouch && !isMobile) return baseSize;

      const touchSizeMap: Record<string, string> = {
        'p-1': 'p-2',
        'p-2': 'p-3',
        'p-3': 'p-4',
        'py-1': 'py-2',
        'py-2': 'py-3',
        'px-2': 'px-3',
        'px-3': 'px-4',
        'h-8': 'h-10',
        'h-10': 'h-12',
        'w-8': 'w-10',
        'w-10': 'w-12',
        'text-sm': 'text-base',
        'text-xs': 'text-sm',
        'min-h-8': 'min-h-11',
        'min-h-10': 'min-h-12',
      };

      return touchSizeMap[baseSize] || baseSize;
    },
    [isTouch, isMobile]
  );

  const getMinTouchTarget = useCallback(() => {
    return isTouch || isMobile ? 'min-h-11 min-w-11' : 'min-h-8 min-w-8';
  }, [isTouch, isMobile]);

  return { getTouchSize, getMinTouchTarget, isTouch: isTouch || isMobile };
};

// Hook for responsive text sizing
export const useResponsiveText = () => {
  const { current } = useBreakpoint();

  const getTextSize = useCallback(
    (base: string) => {
      const sizeMap: Record<string, Record<Breakpoint, string>> = {
        'text-xs': {
          sm: 'text-xs',
          md: 'text-sm',
          lg: 'text-sm',
          xl: 'text-sm',
          '2xl': 'text-sm',
        },
        'text-sm': {
          sm: 'text-sm',
          md: 'text-base',
          lg: 'text-base',
          xl: 'text-base',
          '2xl': 'text-base',
        },
        'text-base': {
          sm: 'text-base',
          md: 'text-lg',
          lg: 'text-lg',
          xl: 'text-lg',
          '2xl': 'text-lg',
        },
        'text-lg': {
          sm: 'text-lg',
          md: 'text-xl',
          lg: 'text-xl',
          xl: 'text-xl',
          '2xl': 'text-xl',
        },
        'text-xl': {
          sm: 'text-xl',
          md: 'text-2xl',
          lg: 'text-2xl',
          xl: 'text-2xl',
          '2xl': 'text-2xl',
        },
      };

      return sizeMap[base]?.[current] || base;
    },
    [current]
  );

  return { getTextSize };
};

// Hook for orientation detection
export const useOrientation = () => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    () => {
      if (typeof window === 'undefined') return 'landscape';
      return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    }
  );

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(
        window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      );
    };

    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return orientation;
};
