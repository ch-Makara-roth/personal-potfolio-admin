// UI component types will be defined here
import { type VariantProps } from 'class-variance-authority';
import {
  buttonVariants,
  cardVariants,
  badgeVariants,
  avatarVariants,
} from '@/components/ui';

// Button types
export type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
export type ButtonSize = VariantProps<typeof buttonVariants>['size'];

// Card types
export type CardVariant = VariantProps<typeof cardVariants>['variant'];
export type CardPadding = VariantProps<typeof cardVariants>['padding'];

// Badge types
export type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];
export type BadgeSize = VariantProps<typeof badgeVariants>['size'];

// Avatar types
export type AvatarSize = VariantProps<typeof avatarVariants>['size'];

// Common UI props
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Layout types
export interface LayoutProps extends BaseComponentProps {
  sidebarCollapsed?: boolean;
}

// Navigation types
export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: number;
  isActive?: boolean;
}

// Stats types
export interface StatsCardData {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    data: number[];
    color: string;
  };
  variant: 'applications' | 'interviews' | 'hired';
}

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan: 'free' | 'pro';
}

// Calendar types
export interface CalendarWidgetProps extends BaseComponentProps {
  currentDate: Date;
  events: Array<{
    date: string;
    type: 'interview' | 'deadline' | 'meeting';
  }>;
  onMonthChange: (date: Date) => void;
  onDateClick?: (date: Date) => void;
}

// Interview types
export interface UpcomingInterviewsProps extends BaseComponentProps {
  interviews: Array<{
    id: string;
    candidate: {
      name: string;
      avatar?: string;
      role: string;
    };
    timeSlot: {
      start: string;
      end: string;
    };
  }>;
  maxVisible?: number;
}

// Jobs Table types
export interface JobsTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface JobsTableProps extends BaseComponentProps {
  jobs: Array<{
    id: string;
    title: string;
    applicationCount: number;
    datePosted: string;
    status: 'active' | 'paused' | 'closed';
  }>;
  loading?: boolean;
  sortConfig?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  onSort?: (field: string) => void;
  onJobAction?: (jobId: string, action: string) => void;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  onPageChange?: (page: number) => void;
}

// Table component types
export interface TableColumn<T = any> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T) => React.ReactNode;
}

export interface TableProps<T = any> extends BaseComponentProps {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  sortConfig?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  onSort?: (field: string) => void;
  emptyMessage?: string;
  responsive?: boolean;
}
