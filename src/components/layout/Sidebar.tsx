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
  LayoutDashboard,
  Layers,
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
        icon: LayoutDashboard,
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
        icon: Layers,
        href: '/projects',
        description: 'Project management and tracking',
      },
      {
        id: 'users',
        label: 'Team',
        icon: Users,
        href: '/team',
        description: 'Team management',
      },
    ],
  },
  {
    id: 'admin',
    label: 'Content',
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
        label: 'Inbox',
        icon: Mail,
        href: '/admin/contact',
        description: 'Manage contact messages',
        badge: 3, // Example badge
      },
      {
        id: 'admin-contact-stats',
        label: 'Analytics',
        icon: BarChart3,
        href: '/admin/contact/stats',
        description: 'Contact analytics and stats',
      },
    ],
  },
  {
    id: 'preferences',
    label: 'System',
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
      {/* Sidebar Backdrop (Mobile only) */}
      <div
        className={cn(
          'fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300',
          collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
        )}
        onClick={onToggle}
        aria-hidden="true"
      />

      {/* Sidebar Container */}
      <aside
        ref={sidebarRef}
        id={sidebarId}
        className={cn(
          'fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)]',
          'bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60',
          'border-r border-gray-200/50 dark:border-gray-800/50',
          collapsed
            ? '-translate-x-full lg:translate-x-0 lg:w-[4.5rem]'
            : 'translate-x-0 w-72',
          isHighContrast && 'border-r-2 border-current'
        )}
        role="navigation"
        aria-label="Main navigation"
        aria-hidden={collapsed}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div
            className={cn(
              'flex items-center h-20 px-6',
              collapsed ? 'justify-center px-0' : 'justify-between'
            )}
          >
            {!collapsed ? (
              <Link href="/dashboard" className="flex items-center gap-3 group">
                <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/30 transition-shadow">
                  <span className="text-white font-bold text-lg">C</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    CONSULT
                  </span>
                  <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest leading-none">
                    Admin
                  </span>
                </div>
              </Link>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg flex items-center justify-center text-white font-bold text-lg">
                C
              </div>
            )}

            {/* Mobile Close Button */}
            <button
              ref={closeButtonRef}
              onClick={onToggle}
              className="lg:hidden p-2 -mr-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close navigation sidebar"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Navigation Groups */}
          <nav
            id={navId}
            className="flex-1 min-h-0 overflow-y-auto py-6 px-3 space-y-8 scrollbar-thin hover:scrollbar-thumb-gray-200 dark:hover:scrollbar-thumb-gray-800"
            aria-label="Main navigation menu"
          >
            {navigationGroups.map((group) => (
              <div key={group.id} aria-labelledby={`${group.id}-label`}>
                {!collapsed && (
                  <h3
                    id={`${group.id}-label`}
                    className="px-4 mb-3 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest"
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
                            'group flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-300 relative',
                            'focus:outline-none',
                            isActive
                              ? 'bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-900/20 shadow-sm shadow-purple-900/5'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-900/50',
                            collapsed && 'justify-center px-2',
                            isHighContrast &&
                              isActive &&
                              'border border-current'
                          )}
                          aria-current={isActive ? 'page' : undefined}
                          aria-describedby={
                            item.description ? `${item.id}-desc` : undefined
                          }
                          prefetch
                          title={collapsed ? item.label : undefined}
                        >
                          {/* Active Indicator Line */}
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-purple-600 rounded-r-full shadow-[0_0_8px_rgba(147,51,234,0.5)]" />
                          )}

                          <Icon
                            className={cn(
                              'w-[1.25rem] h-[1.25rem] transition-all duration-300',
                              isActive
                                ? 'text-purple-600 dark:text-purple-400 drop-shadow-sm'
                                : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                            )}
                            aria-hidden="true"
                          />

                          {!collapsed && (
                            <div className="flex-1 flex items-center justify-between overflow-hidden">
                              <span
                                className={cn(
                                  'text-[0.925rem] font-medium truncate transition-colors duration-200',
                                  isActive
                                    ? 'text-gray-900 dark:text-white'
                                    : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200'
                                )}
                              >
                                {item.label}
                              </span>
                              {item.badge && (
                                <Badge
                                  className={cn(
                                    'ml-2 px-2 py-0.5 text-[10px] h-5 min-w-[20px] flex items-center justify-center rounded-full transition-colors',
                                    isActive
                                      ? 'bg-purple-100/80 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                                  )}
                                >
                                  {item.badge}
                                </Badge>
                              )}
                            </div>
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
          <div className="p-4 border-t border-gray-100/50 dark:border-gray-800/50 bg-gray-50/30 dark:bg-gray-900/30 backdrop-blur-sm">
            {!collapsed ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white text-sm font-semibold shadow-md ring-2 ring-white dark:ring-gray-800">
                  JD
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    John Doe
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    admin@consult.com
                  </div>
                </div>
                <button
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex justify-center">
                <div
                  className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white text-sm font-semibold cursor-pointer shadow-md hover:shadow-lg transition-shadow"
                  title="John Doe"
                >
                  JD
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
