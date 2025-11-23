import {
  useEffect,
  useState,
  useCallback,
  useRef,
  useId as reactUseId,
} from 'react';
import {
  isHighContrastMode,
  prefersReducedMotion,
  trapFocus,
  liveRegionManager,
  KEYBOARD_KEYS,
  type KeyboardKey,
} from '@/utils/accessibility';

// Hook for managing high contrast mode
export const useHighContrast = () => {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const checkHighContrast = () => {
      setIsHighContrast(isHighContrastMode());
    };

    // Initial check
    checkHighContrast();

    // Listen for changes
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    const forcedColorsQuery = window.matchMedia('(forced-colors: active)');

    contrastQuery.addEventListener('change', checkHighContrast);
    forcedColorsQuery.addEventListener('change', checkHighContrast);

    return () => {
      contrastQuery.removeEventListener('change', checkHighContrast);
      forcedColorsQuery.removeEventListener('change', checkHighContrast);
    };
  }, []);

  return isHighContrast;
};

// Hook for managing reduced motion preference
export const useReducedMotion = () => {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);

  useEffect(() => {
    const checkReducedMotion = () => {
      setShouldReduceMotion(prefersReducedMotion());
    };

    // Initial check
    checkReducedMotion();

    // Listen for changes
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    motionQuery.addEventListener('change', checkReducedMotion);

    return () => {
      motionQuery.removeEventListener('change', checkReducedMotion);
    };
  }, []);

  return shouldReduceMotion;
};

// Hook for focus management
export const useFocusManagement = () => {
  const announce = useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      liveRegionManager.announce(message, priority);
    },
    []
  );

  const trapFocusInElement = useCallback((element: HTMLElement | null) => {
    if (!element) return;
    return trapFocus(element);
  }, []);

  const focusElement = useCallback(
    (element: HTMLElement | null, options?: FocusOptions) => {
      if (element) {
        element.focus(options);
      }
    },
    []
  );

  return {
    announce,
    trapFocusInElement,
    focusElement,
  };
};

// Hook for keyboard navigation
export const useKeyboardNavigation = (
  onKeyDown?: (key: string, event: KeyboardEvent) => void
) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const key = event.key;
      onKeyDown?.(key, event);
    },
    [onKeyDown]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    KEYBOARD_KEYS,
  };
};

// Hook for generating SSR-safe, deterministic IDs
export const useId = (prefix?: string) => {
  const id = reactUseId();
  return prefix ? `${prefix}-${id}` : id;
};

// Hook for managing ARIA attributes
export const useAriaAttributes = () => {
  const [ariaAttributes, setAriaAttributes] = useState<Record<string, string>>(
    {}
  );

  const updateAriaAttribute = useCallback((key: string, value: string) => {
    setAriaAttributes((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const removeAriaAttribute = useCallback((key: string) => {
    setAriaAttributes((prev) => {
      const { [key]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const setAriaExpanded = useCallback(
    (expanded: boolean) => {
      updateAriaAttribute('aria-expanded', expanded.toString());
    },
    [updateAriaAttribute]
  );

  const setAriaSelected = useCallback(
    (selected: boolean) => {
      updateAriaAttribute('aria-selected', selected.toString());
    },
    [updateAriaAttribute]
  );

  const setAriaPressed = useCallback(
    (pressed: boolean) => {
      updateAriaAttribute('aria-pressed', pressed.toString());
    },
    [updateAriaAttribute]
  );

  const setAriaChecked = useCallback(
    (checked: boolean | 'mixed') => {
      updateAriaAttribute('aria-checked', checked.toString());
    },
    [updateAriaAttribute]
  );

  return {
    ariaAttributes,
    updateAriaAttribute,
    removeAriaAttribute,
    setAriaExpanded,
    setAriaSelected,
    setAriaPressed,
    setAriaChecked,
  };
};

// Hook for managing focus trap in modals/dropdowns
export const useFocusTrap = <T extends HTMLElement = HTMLDivElement>(
  isActive: boolean
) => {
  const containerRef = useRef<T>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (isActive && containerRef.current) {
      cleanupRef.current = trapFocus(
        containerRef.current as unknown as HTMLElement
      );
    } else if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [isActive]);

  return containerRef;
};

// Hook for managing roving tabindex (for navigation lists)
export const useRovingTabIndex = (
  items: HTMLElement[],
  activeIndex: number = 0
) => {
  useEffect(() => {
    items.forEach((item, index) => {
      if (item) {
        item.tabIndex = index === activeIndex ? 0 : -1;
      }
    });
  }, [items, activeIndex]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent, currentIndex: number) => {
      let newIndex = currentIndex;

      switch (event.key) {
        case KEYBOARD_KEYS.ARROW_DOWN:
        case KEYBOARD_KEYS.ARROW_RIGHT:
          event.preventDefault();
          newIndex = (currentIndex + 1) % items.length;
          break;
        case KEYBOARD_KEYS.ARROW_UP:
        case KEYBOARD_KEYS.ARROW_LEFT:
          event.preventDefault();
          newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
          break;
        case KEYBOARD_KEYS.HOME:
          event.preventDefault();
          newIndex = 0;
          break;
        case KEYBOARD_KEYS.END:
          event.preventDefault();
          newIndex = items.length - 1;
          break;
      }

      if (newIndex !== currentIndex && items[newIndex]) {
        items[newIndex].focus();
      }

      return newIndex;
    },
    [items]
  );

  return { handleKeyDown };
};

// Hook for skip links
export const useSkipLinks = () => {
  const addSkipLink = useCallback((targetId: string, text?: string) => {
    const skipLink = document.createElement('a');
    skipLink.href = `#${targetId}`;
    skipLink.textContent = text || 'Skip to main content';
    skipLink.className =
      'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-purple-600 text-white px-4 py-2 rounded-lg z-50 transition-all duration-200';

    // Insert at the beginning of body
    document.body.insertBefore(skipLink, document.body.firstChild);

    return () => {
      if (skipLink.parentNode) {
        skipLink.parentNode.removeChild(skipLink);
      }
    };
  }, []);

  return { addSkipLink };
};
