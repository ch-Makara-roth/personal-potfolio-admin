'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Menu, Bell, ChevronDown, Sun, Moon, Laptop } from 'lucide-react';
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

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
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
    if (!user) return 'Guest';
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
      className="fixed top-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm"
      role="banner"
    >
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left Section - Logo and Menu */}
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-gray-100 lg:hidden transition-colors focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            aria-label="Toggle navigation sidebar"
            aria-expanded="false"
            aria-controls="sidebar-navigation"
          >
            <Menu className="w-5 h-5 text-gray-600" aria-hidden="true" />
          </button>

          {/* Logo and Title */}
          <div
            className="flex items-center space-x-3"
            role="img"
            aria-labelledby={logoId}
          >
            {/* Blue Crescent Moon Icon */}
            <div
              className={`w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center ${
                isHighContrast ? 'border-2 border-solid border-current' : ''
              }`}
              aria-hidden="true"
            >
              <div className="w-5 h-5 bg-white rounded-full relative">
                <div className="absolute top-1 left-1 w-3 h-3 bg-blue-500 rounded-full"></div>
              </div>
            </div>

            {/* CONSULT Title */}
            <h1
              id={logoId}
              className="text-xl font-bold text-gray-900 hidden sm:block"
            >
              CONSULT
            </h1>
          </div>
        </div>

        {/* Right Section - Plan Badge, Notifications, User */}
        <div
          className="flex items-center space-x-4"
          role="toolbar"
          aria-label="User actions"
        >
          {/* Free Plan Badge */}
          <Badge
            variant="secondary"
            className="hidden sm:flex"
            role="status"
            aria-label="Current plan: Free"
          >
            Free Plan
          </Badge>

          {/* Theme Toggle */}
          <button
            onClick={cycleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
            aria-label={`Switch theme (current: ${theme})`}
            title={`Theme: ${theme}`}
          >
            {theme === 'light' && (
              <Sun
                className="w-5 h-5 text-gray-700 dark:text-gray-300"
                aria-hidden="true"
              />
            )}
            {theme === 'dark' && (
              <Moon
                className="w-5 h-5 text-gray-700 dark:text-gray-300"
                aria-hidden="true"
              />
            )}
            {theme === 'system' && (
              <Laptop
                className="w-5 h-5 text-gray-700 dark:text-gray-300"
                aria-hidden="true"
              />
            )}
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              ref={notificationButtonRef}
              onClick={handleNotificationClick}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              aria-label={
                notificationCount > 0
                  ? `Notifications (${notificationCount} unread)`
                  : 'Notifications'
              }
              aria-describedby={notificationId}
            >
              <Bell
                className="w-5 h-5 text-gray-600 dark:text-gray-300"
                aria-hidden="true"
              />
              {notificationCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 text-white text-xs rounded-full flex items-center justify-center"
                  aria-hidden="true"
                >
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
            <div id={notificationId} className="sr-only">
              {notificationCount > 0
                ? `You have ${notificationCount} unread notifications`
                : 'No unread notifications'}
            </div>
          </div>

          {/* User Avatar and Dropdown */}
          <div className="relative" ref={focusTrapRef}>
            <button
              ref={menuButtonRef}
              onClick={toggleUserMenu}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
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
              />
              <ChevronDown
                className={`w-4 h-4 text-gray-500 hidden sm:block transition-transform ${
                  showUserMenu ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div
                id={menuId}
                className={`absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-40 ${
                  isHighContrast ? 'border-2 border-solid border-current' : ''
                }`}
                role="menu"
                aria-labelledby="user-menu-button"
              >
                <div className="px-4 py-2 border-b border-gray-100" role="none">
                  <p className="text-sm font-medium text-gray-900">
                    {displayName}
                  </p>
                  <p className="text-xs text-gray-500">{displayEmail}</p>
                </div>
                <Link
                  href="/admin/profile/settings"
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors focus:bg-gray-50 focus:outline-none"
                  role="menuitem"
                >
                  Profile Settings
                </Link>
                {/* <button
                  type="button"
                  onClick={() => router.push('/settings')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors focus:bg-gray-50 focus:outline-none"
                  role="menuitem"
                >
                  Account Settings
                </button> */}
                {/* <button
                  type="button"
                  onClick={() => router.push('/settings')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors focus:bg-gray-50 focus:outline-none"
                  role="menuitem"
                >
                  Billing
                </button> */}
                <div className="border-t border-gray-100 mt-2 pt-2" role="none">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors focus:bg-gray-50 focus:outline-none"
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
