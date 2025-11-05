/**
 * Responsive design utilities and breakpoint management
 */
import React from 'react';

// Breakpoint definitions matching Tailwind CSS
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

// Media query helpers
export const createMediaQuery = (
  breakpoint: Breakpoint,
  type: 'min' | 'max' = 'min'
) => {
  const width = BREAKPOINTS[breakpoint];
  return `(${type}-width: ${width}px)`;
};

// Hook for detecting current breakpoint
export const useBreakpoint = () => {
  const isClient = typeof window !== 'undefined';

  const [breakpoint, setBreakpoint] = React.useState<Breakpoint>(() => {
    if (!isClient) return 'lg';
    const width = window.innerWidth;
    if (width < BREAKPOINTS.sm) return 'sm';
    if (width < BREAKPOINTS.md) return 'md';
    if (width < BREAKPOINTS.lg) return 'lg';
    if (width < BREAKPOINTS.xl) return 'xl';
    return '2xl';
  });

  React.useEffect(() => {
    if (!isClient) return;

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
  }, [breakpoint, isClient]);

  return {
    current: breakpoint,
    isMobile: breakpoint === 'sm',
    isTablet: breakpoint === 'md',
    isDesktop: ['lg', 'xl', '2xl'].includes(breakpoint),
  };
};

// Touch detection
export const useTouch = () => {
  const [isTouch, setIsTouch] = React.useState(false);

  React.useEffect(() => {
    const checkTouch = () => {
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };

    checkTouch();
    window.addEventListener('touchstart', checkTouch, { once: true });

    return () => {
      window.removeEventListener('touchstart', checkTouch);
    };
  }, []);

  return isTouch;
};

// Viewport dimensions
export const useViewport = () => {
  const [viewport, setViewport] = React.useState(() => {
    if (typeof window === 'undefined') {
      return { width: 1024, height: 768 };
    }
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  });

  React.useEffect(() => {
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

// Safe area insets for mobile devices
export const useSafeArea = () => {
  const [safeArea, setSafeArea] = React.useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  React.useEffect(() => {
    const updateSafeArea = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      setSafeArea({
        top: parseInt(
          computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0'
        ),
        right: parseInt(
          computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0'
        ),
        bottom: parseInt(
          computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0'
        ),
        left: parseInt(
          computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0'
        ),
      });
    };

    updateSafeArea();
    window.addEventListener('orientationchange', updateSafeArea);

    return () => {
      window.removeEventListener('orientationchange', updateSafeArea);
    };
  }, []);

  return safeArea;
};

// Responsive text sizing
export const getResponsiveTextSize = (base: string, breakpoint: Breakpoint) => {
  const sizeMap = {
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

  return sizeMap[base as keyof typeof sizeMap]?.[breakpoint] || base;
};

// Touch-friendly sizing
export const getTouchFriendlySize = (isTouch: boolean, baseSize: string) => {
  if (!isTouch) return baseSize;

  const touchSizeMap = {
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
  };

  return touchSizeMap[baseSize as keyof typeof touchSizeMap] || baseSize;
};

// Responsive grid columns
export const getResponsiveColumns = (
  breakpoint: Breakpoint,
  maxColumns: number = 3
) => {
  const columnMap = {
    sm: 1,
    md: Math.min(2, maxColumns),
    lg: Math.min(3, maxColumns),
    xl: maxColumns,
    '2xl': maxColumns,
  };

  return columnMap[breakpoint];
};

// Container padding based on breakpoint
export const getContainerPadding = (breakpoint: Breakpoint) => {
  const paddingMap = {
    sm: 'px-4',
    md: 'px-6',
    lg: 'px-6',
    xl: 'px-8',
    '2xl': 'px-8',
  };

  return paddingMap[breakpoint];
};

// Focus management for mobile
export const useMobileFocus = () => {
  const isTouch = useTouch();
  const { isMobile } = useBreakpoint();

  const focusElement = React.useCallback(
    (element: HTMLElement | null) => {
      if (!element) return;

      // On mobile/touch devices, scroll element into view
      if (isMobile || isTouch) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      }

      element.focus();
    },
    [isMobile, isTouch]
  );

  return { focusElement };
};

// (React import moved to top)
