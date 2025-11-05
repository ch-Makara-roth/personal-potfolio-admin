# Design Document

## Overview

The CONSULT hiring analytics dashboard is designed as a modern, responsive web application built with React, TypeScript, and Next.js. The design emphasizes clean minimalism with a purple-blue color palette, featuring a comprehensive layout that includes statistical widgets, data visualizations, and management interfaces. The application follows a component-driven architecture with reusable UI elements and seamless API integration for real-time data updates.

## Architecture

### Frontend Architecture

- **Framework**: Next.js 14+ with React 18+ and TypeScript
- **Styling**: Tailwind CSS with custom design tokens for the purple-blue theme
- **State Management**: TanStack Query for server state, Zustand for client state
- **Component Library**: Custom components built on Headless UI/Radix UI primitives
- **Charts**: Recharts or Chart.js for data visualizations
- **Icons**: Lucide React for consistent iconography

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│ Header (Logo, Title, User Controls)                     │
├─────────────┬───────────────────────────────────────────┤
│             │ Main Content Area                         │
│  Sidebar    │ ┌─────────────┬─────────────────────────┐ │
│  Navigation │ │ Stats Cards │ Calendar & Interviews   │ │
│             │ ├─────────────┴─────────────────────────┤ │
│             │ │ Analytics Chart                       │ │
│             │ ├───────────────────────────────────────┤ │
│             │ │ Jobs Table & Upgrade Card             │ │
│             │ └───────────────────────────────────────┘ │
└─────────────┴───────────────────────────────────────────┘
```

### Responsive Breakpoints

- **Mobile**: < 768px (stacked layout, collapsible sidebar)
- **Tablet**: 768px - 1024px (adjusted grid, sidebar overlay)
- **Desktop**: > 1024px (full layout as designed)

## Components and Interfaces

### Core Layout Components

#### AppLayout

```typescript
interface AppLayoutProps {
  children: React.ReactNode;
  sidebarCollapsed?: boolean;
}
```

- Manages overall application structure
- Handles responsive sidebar behavior
- Provides consistent spacing and theming

#### Header

```typescript
interface HeaderProps {
  title: string;
  userPlan: 'free' | 'pro';
  notificationCount?: number;
  user: {
    name: string;
    avatar: string;
  };
}
```

- Displays app logo (blue crescent moon) and "CONSULT" title
- Shows plan badge, notifications, and user dropdown
- Responsive design for mobile screens

#### Sidebar

```typescript
interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  activeRoute: string;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: number;
}
```

- Fixed 200px width on desktop, overlay on mobile
- Light blue icons with hover states
- Badge support for Team & Availability count

### Dashboard Components

#### StatsCard

```typescript
interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  trend?: {
    data: number[];
    color: string;
  };
  variant: 'applications' | 'interviews' | 'hired';
}
```

- Rounded cards with purple borders and gradients
- Icon integration (document, circle, check icons)
- Optional trend line for applications card
- Responsive sizing and typography

#### HiringSourcesChart

```typescript
interface HiringSourcesChartProps {
  data: {
    source: string;
    value: number;
    category: 'design' | 'engineering' | 'marketing';
  }[];
}
```

- Horizontal bar chart with 0-100 scale
- Color-coded bars: dark blue, cyan, orange
- Interactive legend with category filtering
- Responsive chart sizing

#### UpcomingInterviews

```typescript
interface Interview {
  id: string;
  candidate: {
    name: string;
    avatar: string;
    role: string;
  };
  timeSlot: {
    start: string;
    end: string;
  };
}

interface UpcomingInterviewsProps {
  interviews: Interview[];
  maxVisible?: number;
}
```

- Stacked card layout with candidate information
- Light blue time badges
- Avatar integration with fallback initials
- Empty state handling

#### CalendarWidget

```typescript
interface CalendarWidgetProps {
  currentDate: Date;
  events: {
    date: string;
    type: 'interview' | 'deadline' | 'meeting';
  }[];
  onMonthChange: (date: Date) => void;
}
```

- Month grid view with navigation arrows
- Event highlighting with colored dots
- Keyboard navigation support
- Mobile-optimized touch interactions

#### JobsTable

```typescript
interface Job {
  id: string;
  title: string;
  applicationCount: number;
  datePosted: string;
  status: 'active' | 'paused' | 'closed';
}

interface JobsTableProps {
  jobs: Job[];
  onJobAction: (jobId: string, action: string) => void;
}
```

- Sortable columns with icons
- Action dropdown menus
- Responsive table with mobile card view
- Pagination support for large datasets

#### UpgradeCard

```typescript
interface UpgradeCardProps {
  currentPlan: string;
  features: string[];
  onUpgrade: () => void;
}
```

- Prominent call-to-action design
- Rocket icon with purple gradient button
- Feature comparison highlights
- Dismissible with user preference storage

## Data Models

### Dashboard Data

```typescript
interface DashboardData {
  stats: {
    applications: {
      count: number;
      trend: number[];
    };
    interviews: {
      count: number;
      scheduled: number;
    };
    hired: {
      count: number;
      thisMonth: number;
    };
  };
  hiringSourcesData: HiringSource[];
  upcomingInterviews: Interview[];
  currentJobs: Job[];
  calendarEvents: CalendarEvent[];
}
```

### API Response Types

```typescript
interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
  timestamp: string;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
}
```

## Error Handling

### Error Boundary Strategy

- Global error boundary for unhandled exceptions
- Component-level error boundaries for isolated failures
- Graceful degradation with skeleton loaders
- User-friendly error messages with retry options

### API Error Handling

```typescript
interface ErrorState {
  type: 'network' | 'validation' | 'authorization' | 'server';
  message: string;
  retryable: boolean;
  timestamp: Date;
}
```

- Automatic retry for transient failures
- Toast notifications for user feedback
- Offline state detection and handling
- Error logging for debugging

### Loading States

- Skeleton components for initial loads
- Progressive loading for large datasets
- Optimistic updates for user actions
- Loading indicators with progress feedback

## Testing Strategy

### Component Testing

- Unit tests for all UI components using Jest and React Testing Library
- Visual regression tests with Storybook and Chromatic
- Accessibility testing with axe-core
- Responsive design testing across breakpoints

### Integration Testing

- API integration tests with MSW (Mock Service Worker)
- User flow testing with Playwright
- Cross-browser compatibility testing
- Performance testing with Lighthouse

### Test Coverage Goals

- 90%+ unit test coverage for components
- 100% coverage for utility functions
- E2E tests for critical user journeys
- Accessibility compliance verification

## Design System

### Color Palette

```css
:root {
  /* Primary Purple Gradient */
  --purple-600: #6b46c1;
  --purple-400: #a78bfa;

  /* Blue Accent Gradient */
  --blue-600: #3182ce;
  --blue-200: #cbd5e0;

  /* Supporting Colors */
  --orange-400: #ed8936;
  --cyan-400: #00b5ff;

  /* Neutral Grays */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-900: #111827;
}
```

### Typography Scale

```css
/* Font Family */
font-family:
  'Inter',
  -apple-system,
  BlinkMacSystemFont,
  sans-serif;

/* Type Scale */
--text-xs: 0.75rem; /* 12px */
--text-sm: 0.875rem; /* 14px */
--text-base: 1rem; /* 16px */
--text-lg: 1.125rem; /* 18px */
--text-xl: 1.25rem; /* 20px */
--text-2xl: 1.5rem; /* 24px */
--text-3xl: 1.875rem; /* 30px */
```

### Spacing System

```css
/* Spacing Scale (Tailwind-based) */
--space-1: 0.25rem; /* 4px */
--space-2: 0.5rem; /* 8px */
--space-4: 1rem; /* 16px */
--space-6: 1.5rem; /* 24px */
--space-8: 2rem; /* 32px */
--space-12: 3rem; /* 48px */
```

### Component Styling Patterns

- Rounded corners: `border-radius: 0.75rem` (12px)
- Card shadows: `box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1)`
- Frosted glass effect: `backdrop-filter: blur(8px)`
- Gradient overlays for interactive states
- Consistent hover and focus states

## Performance Considerations

### Optimization Strategies

- Code splitting by route and feature
- Lazy loading for non-critical components
- Image optimization with Next.js Image component
- Bundle analysis and tree shaking
- Service worker for offline functionality

### Data Loading Patterns

- Stale-while-revalidate for dashboard data
- Infinite scrolling for large lists
- Debounced search and filtering
- Optimistic updates for immediate feedback
- Background data synchronization

### Accessibility Features

- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader optimization
- High contrast mode support
- Reduced motion preferences
- Focus management for modals and dropdowns
