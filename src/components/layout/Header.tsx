'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Menu,
  Bell,
  ChevronDown,
  Sun,
  Moon,
  Laptop,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import {
  useId,
  useFocusManagement,
  useKeyboardNavigation,
  useFocusTrap,
  useAriaAttributes,
  useHighContrast,
} from '@/hooks/useAccessibility';
import { useThemeState, useUIStore, useAuthStore } from '@/stores';
import { authApi } from '@/lib/api/auth';
import { useRouter } from 'next/navigation';
import type { AuthUser } from '@/types/api';
import { cn } from '@/utils/cn';

interface HeaderProps {
  onMenuClick: () => void;
  sidebarCollapsed: boolean;
}

export function Header({ onMenuClick, sidebarCollapsed }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notificationCount] = useState(3); // Mock notification count
  const [userProfile, setUserProfile] = useState<AuthUser | null>(null);

  const isHighContrast = useHighContrast();
  const { announce } = useFocusManagement();
  const { ariaAttributes, setAriaExpanded } = useAriaAttributes();
  const focusTrapRef = useFocusTrap(showUserMenu);

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);

  // Theme state
  const { theme } = useThemeState();
  const setTheme = useUIStore((s) => s.setTheme);
  const clearSession = useAuthStore((s) => s.clearSession);
  const storedUser = useAuthStore((s) => s.user);
  const router = useRouter();

  const cycleTheme = () => {
    const next =
      theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(next);
    announce(`Theme set to ${next}`, 'polite');
  };

  // Generate stable IDs for ARIA relationships
  const menuId = useId('user-menu');
  const notificationId = useId('notifications');
  const logoId = useId('logo');

  // Fetch user profile on mount if not in store
  useEffect(() => {
    let mounted = true;
    if (!storedUser) {
      authApi
        .getProfile()
        .then((resp) => {
          if (mounted && resp.status === 'success') {
            setUserProfile(resp.data);
          }
        })
        .catch(() => {
          // silence errors for header; could show notification if desired
        });
    } else {
      setUserProfile(storedUser);
    }
    return () => {
      mounted = false;
    };
  }, [storedUser]);

  const displayName = useMemo(() => {
    const user = userProfile || storedUser;
    if (!user) return 'User';
    const first = user.firstName?.trim();
    const last = user.lastName?.trim();
    if (first || last)
      return `${first ?? ''}${first && last ? ' ' : ''}${last ?? ''}`.trim();
    if (user.username) return user.username;
    return user.email.split('@')[0];
  }, [userProfile, storedUser]);

  const displayEmail = useMemo(() => {
    const user = userProfile || storedUser;
    return user?.email ?? 'unknown@domain';
  }, [userProfile, storedUser]);

  const avatarSrc = useMemo(() => {
    const user = userProfile || storedUser;
    return user?.avatar ?? '/api/placeholder/32/32';
  }, [userProfile, storedUser]);

  const avatarFallback = useMemo(() => {
    const user = userProfile || storedUser;
    const first = user?.firstName?.[0] ?? '';
    const last = user?.lastName?.[0] ?? '';
    const initials = `${first}${last}`;
    return initials || (user?.username?.[0]?.toUpperCase() ?? 'U');
  }, [userProfile, storedUser]);

  const toggleUserMenu = () => {
    const newShowState = !showUserMenu;
    setShowUserMenu(newShowState);
    setAriaExpanded(newShowState);

    if (newShowState) {
      announce('User menu opened', 'polite');
    } else {
      announce('User menu closed', 'polite');
      // Return focus to menu button when closing
      menuButtonRef.current?.focus();
    }
  };

  const handleSignOut = () => {
    clearSession();
    setShowUserMenu(false);
    announce('Signed out', 'polite');
    try {
      const uid = storedUser?.id;
      const { logAuthEvent } = require('@/services/auth-logging');
      logAuthEvent('logout', { userId: uid });
    } catch {}
    router.push('/login');
  };

  const handleNotificationClick = () => {
    announce(`${notificationCount} notifications available`, 'polite');
  };

  // Keyboard navigation for user menu
  useKeyboardNavigation((key, event) => {
    if (showUserMenu && key === 'Escape') {
      event.preventDefault();
      setShowUserMenu(false);
      setAriaExpanded(false);
      menuButtonRef.current?.focus();
      announce('User menu closed', 'polite');
    }
  });

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showUserMenu &&
        focusTrapRef.current &&
        !focusTrapRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
        setAriaExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu, focusTrapRef, setAriaExpanded]);

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-16 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)]',
        'bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60',
        'border-b border-gray-200/50 dark:border-gray-800/50',
        'left-0 lg:left-72', // Default expanded state
        sidebarCollapsed && 'lg:left-[4.5rem]' // Collapsed state
      )}
      role="banner"
    >
      <div className="flex items-center justify-between h-full px-4 lg:px-6 max-w-[1920px] mx-auto">
        {/* Left Section - Logo and Menu */}
        <div className="flex items-center gap-4">
          {/* Menu Button (Sidebar Toggle) */}
          <button
            onClick={onMenuClick}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none text-gray-600 dark:text-gray-400"
            aria-label="Toggle navigation sidebar"
            aria-expanded={!sidebarCollapsed}
            aria-controls="sidebar-navigation"
          >
            <Menu
              className="w-5 h-5 text-gray-600 dark:text-gray-400"
              aria-hidden="true"
            />
          </button>

          {/* Search Bar (Optional placeholder for future) */}
          <div className="hidden md:flex items-center px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg border border-transparent focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500 transition-all w-64">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent border-none focus:outline-none text-sm text-gray-900 dark:text-gray-100 w-full placeholder-gray-500"
            />
          </div>
        </div>

        {/* Right Section - Plan Badge, Notifications, User */}
        <div
          className="flex items-center gap-2 sm:gap-4"
          role="toolbar"
          aria-label="User actions"
        >
          {/* Free Plan Badge */}
          <Badge
            variant="outline"
            className="hidden sm:flex border-purple-200 text-purple-700 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300"
            role="status"
            aria-label="Current plan: Free"
          >
            Free Plan
          </Badge>

          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />

          {/* Theme Toggle */}
          <button
            onClick={cycleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
            aria-label={`Switch theme (current: ${theme})`}
            title={`Theme: ${theme}`}
          >
            {theme === 'light' && (
              <Sun className="w-5 h-5" aria-hidden="true" />
            )}
            {theme === 'dark' && (
              <Moon className="w-5 h-5" aria-hidden="true" />
            )}
            {theme === 'system' && (
              <Laptop className="w-5 h-5" aria-hidden="true" />
            )}
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              ref={notificationButtonRef}
              onClick={handleNotificationClick}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative text-gray-500 dark:text-gray-400"
              aria-label={
                notificationCount > 0
                  ? `Notifications (${notificationCount} unread)`
                  : 'Notifications'
              }
              aria-describedby={notificationId}
            >
              <Bell className="w-5 h-5" aria-hidden="true" />
              {notificationCount > 0 && (
                <span
                  className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900"
                  aria-hidden="true"
                />
              )}
            </button>
          </div>

          {/* User Avatar and Dropdown */}
          <div className="relative ml-2" ref={focusTrapRef}>
            <button
              ref={menuButtonRef}
              onClick={toggleUserMenu}
              className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
              aria-label="User account menu"
              aria-expanded={showUserMenu}
              aria-haspopup="menu"
              aria-controls={menuId}
              {...ariaAttributes}
            >
              <Avatar
                src={avatarSrc}
                alt="User Avatar"
                fallback={avatarFallback}
                size="sm"
                className="ring-2 ring-white dark:ring-gray-900"
              />
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-gray-500 transition-transform duration-200',
                  showUserMenu && 'rotate-180'
                )}
                aria-hidden="true"
              />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div
                id={menuId}
                className={cn(
                  'absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 py-2 z-50 transform origin-top-right transition-all',
                  'animate-in fade-in zoom-in-95 duration-200',
                  isHighContrast && 'border-2 border-solid border-current'
                )}
                role="menu"
                aria-labelledby="user-menu-button"
              >
                <div
                  className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 mx-2 rounded-lg mb-2"
                  role="none"
                >
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {displayName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {displayEmail}
                  </p>
                </div>

                <div className="px-2 space-y-1">
                  <Link
                    href="/admin/profile/settings"
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    role="menuitem"
                  >
                    Profile Settings
                  </Link>
                  {/* Add more menu items here if needed */}
                </div>

                <div
                  className="border-t border-gray-100 dark:border-gray-800 mt-2 pt-2 px-2"
                  role="none"
                >
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex items-center w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    role="menuitem"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
// EOF
