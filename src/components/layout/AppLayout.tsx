'use client';

import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import {
  useId,
  useFocusManagement,
  useKeyboardNavigation,
  useSkipLinks,
  useReducedMotion,
} from '@/hooks/useAccessibility';
import { useBreakpoint, useResponsiveSpacing } from '@/hooks/useResponsive';
import { cn } from '@/utils/cn';

interface AppLayoutProps {
  children: React.ReactNode;
  sidebarCollapsed?: boolean;
  /**
   * Optional classes applied to the inner content container that wraps {children}.
   * Use this to constrain width on specific pages (e.g., "max-w-5xl mx-auto").
   * By default, content is full-width.
   */
  contentContainerClassName?: string;
}

export function AppLayout({
  children,
  sidebarCollapsed: initialCollapsed = false,
  contentContainerClassName,
}: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(initialCollapsed);
  const shouldReduceMotion = useReducedMotion();
  const { announce } = useFocusManagement();
  const { addSkipLink } = useSkipLinks();
  const { isMobile, isTablet } = useBreakpoint();
  const { getPadding } = useResponsiveSpacing();

  // Generate stable IDs for skip links and ARIA relationships
  const mainContentId = useId('main-content');
  const sidebarId = useId('sidebar');
  const headerId = useId('header');

  // Auto-collapse sidebar when entering mobile view, but don't override user toggles
  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  }, [isMobile]);

  const toggleSidebar = () => {
    const newCollapsed = !sidebarCollapsed;
    setSidebarCollapsed(newCollapsed);

    // Announce sidebar state change
    announce(
      newCollapsed
        ? 'Navigation sidebar collapsed'
        : 'Navigation sidebar expanded',
      'polite'
    );
  };

  // Add skip links on mount
  useEffect(() => {
    const removeMainSkipLink = addSkipLink(
      mainContentId,
      'Skip to main content'
    );
    const removeSidebarSkipLink = addSkipLink(sidebarId, 'Skip to navigation');

    return () => {
      removeMainSkipLink();
      removeSidebarSkipLink();
    };
  }, [addSkipLink, mainContentId, sidebarId]);

  // Handle global keyboard shortcuts
  useKeyboardNavigation((key, event) => {
    // Alt + M to toggle sidebar
    if (event.altKey && key === 'm') {
      event.preventDefault();
      toggleSidebar();
    }

    // Alt + 1 to focus main content
    if (event.altKey && key === '1') {
      event.preventDefault();
      const mainContent = document.getElementById(mainContentId);
      if (mainContent) {
        mainContent.focus();
        announce('Focused main content', 'polite');
      }
    }
  });

  const transitionClasses = shouldReduceMotion
    ? ''
    : 'transition-all duration-300 ease-in-out';

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 safe-area-inset">
      {/* Skip Links - These will be added by the useSkipLinks hook */}

      {/* Header */}
      <div id={headerId}>
        <Header onMenuClick={toggleSidebar} />
      </div>

      {/* Sidebar */}
      <div id={sidebarId}>
        <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {!sidebarCollapsed && (isMobile || isTablet) && (
        <div
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={toggleSidebar}
          onTouchEnd={toggleSidebar}
          aria-hidden="true"
          role="presentation"
        />
      )}

      {/* Main Content Area */}
      <main
        id={mainContentId}
        className={cn(
          'flex-1 min-h-screen pt-16 transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'
        )}
        role="main"
        aria-label="Main content"
        tabIndex={-1}
      >
        {/* Content wrapper with responsive spacing */}
        <div
          className={cn(
            'p-4 md:p-6 xl:p-8 w-full max-w-[1600px] mx-auto',
            contentContainerClassName
          )}
        >
          {/* Landmark for screen readers */}
          <div className="sr-only">
            <h1>Main Content Area</h1>
            <p>
              {isMobile
                ? 'Tap menu button to open navigation, swipe to close sidebar overlay'
                : 'Use Alt+M to toggle navigation sidebar, Alt+1 to focus main content'}
            </p>
          </div>

          <div className="space-y-6">{children}</div>
        </div>
      </main>

      {/* Live region for announcements - managed by accessibility hooks */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="live-region-polite"
      ></div>
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        id="live-region-assertive"
      ></div>
    </div>
  );
}
