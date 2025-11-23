'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  Briefcase,
  UserCheck,
  Settings,
  Bell,
  X,
  FileText,
  MessageSquare,
  Mail,
  BarChart3,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import {
  useId,
  useFocusManagement,
  useKeyboardNavigation,
  useRovingTabIndex,
  useHighContrast,
} from '@/hooks/useAccessibility';
import { cn } from '@/utils/cn';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: number;
  description?: string;
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

// Grouped navigation for better UI organization
interface NavigationGroup {
  id: string;
  label: string;
  description?: string;
  items: NavigationItem[];
}

const navigationGroups: NavigationGroup[] = [
  {
    id: 'overview',
    label: 'Overview',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: BarChart3,
        href: '/dashboard',
        description: 'Dashboard and overview',
      },
    ],
  },
  {
    id: 'management',
    label: 'Management',
    items: [
      {
        id: 'projects',
        label: 'Projects',
        icon: Users,
        href: '/projects',
        description: 'Project management and tracking',
      },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    items: [
      {
        id: 'admin-blog-posts',
        label: 'Blog Posts',
        icon: FileText,
        href: '/admin/blog/posts',
        description: 'Manage blog posts',
      },
      {
        id: 'admin-comments',
        label: 'Comments',
        icon: MessageSquare,
        href: '/admin/comments',
        description: 'Moderate blog comments',
      },
      {
        id: 'admin-contact',
        label: 'Contact',
        icon: Mail,
        href: '/admin/contact',
        description: 'Manage contact messages',
      },
      {
        id: 'admin-contact-stats',
        label: 'Contact Stats',
        icon: BarChart3,
        href: '/admin/contact/stats',
        description: 'Contact analytics and stats',
      },
    ],
  },
  {
    id: 'preferences',
    label: 'Preferences',
    items: [
      {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        href: '/settings',
        description: 'Application settings and preferences',
      },
      {
        id: 'notifications',
        label: 'Notifications',
        icon: Bell,
        href: '/notifications',
        description: 'Notification center and alerts',
      },
    ],
  },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const isHighContrast = useHighContrast();
  const { announce } = useFocusManagement();

  const sidebarRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const navItemRefs = useRef<HTMLAnchorElement[]>([]);

  // Generate stable IDs
  const sidebarId = useId('sidebar-navigation');
  const navId = useId('main-navigation');

  // Active matching (supports nested routes like /admin/contact/[id])
  const isItemActive = (item: NavigationItem) =>
    pathname === item.href ||
    (item.href !== '/' && pathname.startsWith(item.href));

  // Flatten all items across groups for active matching and roving tabindex
  const allNavItems = navigationGroups.flatMap((group) => group.items);

  // Map item id to flat index
  const itemIndexMap = new Map<string, number>();
  allNavItems.forEach((item, index) => itemIndexMap.set(item.id, index));

  // Find current active item index for roving tabindex
  const activeIndex = allNavItems.findIndex(isItemActive);

  // Set up roving tabindex for navigation items
  const { handleKeyDown } = useRovingTabIndex(
    navItemRefs.current,
    Math.max(0, activeIndex)
  );

  // Handle keyboard navigation within sidebar
  useKeyboardNavigation((key, event) => {
    if (!collapsed && sidebarRef.current?.contains(event.target as Node)) {
      if (key === 'Escape') {
        event.preventDefault();
        onToggle();
        announce('Sidebar closed', 'polite');
      }
    }
  });

  // Focus management when sidebar opens/closes
  useEffect(() => {
    if (!collapsed) {
      // Focus first navigation item when sidebar opens
      const firstNavItem = navItemRefs.current[0];
      if (firstNavItem) {
        firstNavItem.focus();
      }
      announce('Navigation sidebar opened', 'polite');
    }
  }, [collapsed, announce]);

  const handleNavItemKeyDown = (event: React.KeyboardEvent, index: number) => {
    const newIndex = handleKeyDown(event.nativeEvent, index);
    if (newIndex !== index && navItemRefs.current[newIndex]) {
      navItemRefs.current[newIndex].focus();
    }
  };

  const handleNavItemClick = (item: NavigationItem) => {
    announce(`Navigating to ${item.label}`, 'polite');
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        id={sidebarId}
        className={cn(
          'fixed top-0 left-0 z-40 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out shadow-sm',
          collapsed
            ? '-translate-x-full lg:translate-x-0 lg:w-20'
            : 'translate-x-0 w-72',
          isHighContrast && 'border-2 border-solid border-current'
        )}
        role="navigation"
        aria-label="Main navigation"
        aria-hidden={collapsed}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div
            className={cn(
              'flex items-center h-16 px-6 border-b border-gray-100 dark:border-gray-800',
              collapsed ? 'justify-center px-0' : 'justify-between'
            )}
          >
            {!collapsed && (
              <div className="flex items-center gap-2 font-bold text-xl text-gray-900 dark:text-white">
                <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white">
                  C
                </div>
                <span>CONSULT</span>
              </div>
            )}
            {collapsed && (
              <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold">
                C
              </div>
            )}

            {/* Mobile Close Button */}
            <button
              ref={closeButtonRef}
              onClick={onToggle}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              aria-label="Close navigation sidebar"
            >
              <X className="w-5 h-5 text-gray-600" aria-hidden="true" />
            </button>
          </div>

          {/* Navigation Groups */}
          <nav
            id={navId}
            className="flex-1 min-h-0 overflow-y-auto py-6 px-3 space-y-6"
            aria-label="Main navigation menu"
          >
            {navigationGroups.map((group) => (
              <div key={group.id} aria-labelledby={`${group.id}-label`}>
                {!collapsed && (
                  <h3
                    id={`${group.id}-label`}
                    className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider"
                  >
                    {group.label}
                  </h3>
                )}

                <ul role="list" className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const index = itemIndexMap.get(item.id) ?? 0;
                    const isActive = isItemActive(item);
                    const tabIndex =
                      index === Math.max(0, activeIndex) ? 0 : -1;

                    return (
                      <li key={item.id} role="listitem">
                        <Link
                          ref={(el) => {
                            if (el) navItemRefs.current[index] = el;
                          }}
                          href={item.href}
                          onClick={() => handleNavItemClick(item)}
                          onKeyDown={(e) => handleNavItemKeyDown(e, index)}
                          tabIndex={tabIndex}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative',
                            'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
                            isActive
                              ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 font-medium'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200',
                            isHighContrast &&
                              isActive &&
                              'border-2 border-solid border-current',
                            collapsed && 'justify-center px-2'
                          )}
                          aria-current={isActive ? 'page' : undefined}
                          aria-describedby={
                            item.description ? `${item.id}-desc` : undefined
                          }
                          prefetch
                          title={collapsed ? item.label : undefined}
                        >
                          <Icon
                            className={cn(
                              'w-5 h-5 transition-colors',
                              isActive
                                ? 'text-purple-600 dark:text-purple-400'
                                : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                            )}
                            aria-hidden="true"
                          />

                          {!collapsed && (
                            <>
                              <span className="flex-1 truncate">
                                {item.label}
                              </span>
                              {item.badge && (
                                <Badge
                                  variant="secondary"
                                  className="ml-auto text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                                >
                                  {item.badge}
                                </Badge>
                              )}
                            </>
                          )}

                          {/* Active Indicator Strip for Collapsed State */}
                          {collapsed && isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-600 rounded-r-full" />
                          )}

                          {item.description && (
                            <span id={`${item.id}-desc`} className="sr-only">
                              {item.description}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {/* Footer User/Logout Section */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-800">
            {!collapsed ? (
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">© 2024 CONSULT</div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700" />
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
