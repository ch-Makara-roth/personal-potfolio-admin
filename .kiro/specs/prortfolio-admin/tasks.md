# Implementation Plan

- [x] 1. Set up project structure and core configuration
  - Initialize Next.js 14+ project with TypeScript and Tailwind CSS
  - Configure custom design tokens for purple-blue color palette
  - Set up ESLint, Prettier, and TypeScript strict mode
  - Install core dependencies: Headless UI, Lucide React, TanStack Query, Zustand
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 2. Create design system foundation and base UI components
  - [x] 2.1 Implement design system tokens and Tailwind configuration
    - Create custom CSS variables for color palette and spacing
    - Configure Tailwind with custom theme extensions
    - Set up typography scale and component styling patterns
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 2.2 Build foundational UI components
    - Create Button component with purple gradient variants
    - Implement Card component with rounded corners and shadows
    - Build Badge component for plan status and notifications
    - Create Avatar component with fallback initials
    - _Requirements: 9.2, 9.3, 9.4_

  - [x] 2.3 Write unit tests for base UI components
    - Test Button component variants and interactions
    - Test Card component styling and responsive behavior
    - Test Badge and Avatar component rendering
    - _Requirements: 9.2, 9.3, 9.4_

- [x] 3. Implement core layout components
  - [x] 3.1 Create AppLayout component with responsive structure
    - Build main layout container with sidebar and content areas
    - Implement responsive breakpoint handling
    - Add sidebar collapse/expand functionality
    - _Requirements: 2.1, 8.1, 8.3_

  - [x] 3.2 Build Header component with branding and user controls
    - Create logo area with blue crescent moon icon and "CONSULT" title
    - Implement "Free Plan" badge and notification bell
    - Build user avatar dropdown with menu options
    - Add responsive header behavior for mobile
    - _Requirements: 7.1, 7.2, 8.1, 8.3, 9.1_

  - [x] 3.3 Implement Sidebar navigation component
    - Create navigation items with icons and labels
    - Add hover states with light blue icon highlighting
    - Implement badge support for Team & Availability count
    - Build responsive sidebar with overlay behavior on mobile
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 8.1, 8.3_

  - [x] 3.4 Write unit tests for layout components
    - Test AppLayout responsive behavior and sidebar functionality
    - Test Header component rendering and user interactions
    - Test Sidebar navigation and mobile overlay behavior
    - _Requirements: 2.1, 7.1, 8.1, 8.3_

- [x] 4. Create dashboard statistics components
  - [x] 4.1 Build StatsCard component with icon and trend support
    - Create card layout with purple borders and gradients
    - Implement icon integration for document, circle, and check icons
    - Add optional trend line visualization for applications card
    - Build responsive card sizing and typography
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 9.2, 9.3_

  - [x] 4.2 Implement statistics data integration
    - Create API hooks for fetching dashboard statistics
    - Build data transformation utilities for stats display
    - Implement real-time data refresh functionality
    - Add loading and error states for statistics
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

  - [x] 4.3 Write unit tests for statistics components
    - Test StatsCard component variants and data display
    - Test API integration hooks and data transformation
    - Test loading and error state handling
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 5. Implement calendar widget and upcoming interviews
  - [x] 5.1 Create CalendarWidget component
    - Build month grid view with date cells
    - Implement navigation arrows for month selection
    - Add event highlighting with colored dots
    - Create responsive calendar layout for mobile
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 8.1, 8.3_

  - [x] 5.2 Build UpcomingInterviews component
    - Create stacked card layout for interview display
    - Implement candidate avatar, name, and role display
    - Add light blue time badges for interview slots
    - Build empty state handling for no interviews
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 5.3 Integrate calendar and interview data
    - Create API hooks for calendar events and interviews
    - Implement date navigation and event filtering
    - Add keyboard navigation support for accessibility
    - Build mobile-optimized touch interactions
    - _Requirements: 3.1, 6.1, 8.2, 8.4_

  - [x] 5.4 Write unit tests for calendar and interview components
    - Test CalendarWidget navigation and event display
    - Test UpcomingInterviews component rendering and empty states
    - Test keyboard navigation and accessibility features
    - _Requirements: 3.1, 6.1, 8.2, 8.4_

- [x] 6. Create hiring analytics chart component
  - [x] 6.1 Build HiringSourcesChart with horizontal bar visualization
    - Implement horizontal bar chart with 0-100 scale
    - Create color-coded bars: dark blue, cyan, orange
    - Add interactive legend with category filtering
    - Build responsive chart sizing for different screens
    - _Requirements: 4.1, 4.2, 4.3, 8.1, 8.3_

  - [x] 6.2 Integrate chart data and interactions
    - Create API hooks for hiring sources analytics data
    - Implement chart data transformation and formatting
    - Add real-time chart updates when data changes
    - Build chart interaction handlers for legend filtering
    - _Requirements: 4.1, 4.4, 4.5_

  - [x] 6.3 Write unit tests for analytics chart
    - Test chart rendering with different data sets
    - Test interactive legend functionality
    - Test responsive chart behavior
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [x] 7. Implement jobs management table
  - [x] 7.1 Create JobsTable component with sortable columns
    - Build table layout with Job Title, Applications, Date Posted, Options columns
    - Implement sortable column headers with icons
    - Add application count display with file icons
    - Create date display with calendar icons
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 7.2 Build responsive table with mobile card view
    - Create responsive table that converts to card layout on mobile
    - Implement action dropdown menus with dots icon
    - Add pagination support for large job datasets
    - Build table row hover and selection states
    - _Requirements: 5.1, 5.5, 8.1, 8.3_

  - [x] 7.3 Integrate jobs data and actions
    - Create API hooks for fetching and managing job listings
    - Implement job action handlers (edit, pause, delete)
    - Add optimistic updates for immediate user feedback
    - Build error handling for job management operations
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 7.4 Write unit tests for jobs table
    - Test table rendering and sorting functionality
    - Test responsive behavior and mobile card view
    - Test job action handlers and API integration
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 8. Create upgrade promotion component
  - [x] 8.1 Build UpgradeCard component with call-to-action design
    - Create prominent card layout with rocket icon
    - Implement purple gradient "Upgrade Now" button
    - Add feature comparison highlights
    - Build dismissible card with user preference storage
    - _Requirements: 7.3, 7.4, 9.1, 9.3_

  - [x] 8.2 Integrate upgrade functionality
    - Create upgrade action handlers and navigation
    - Implement user plan status checking
    - Add upgrade tracking and analytics
    - Build success and error handling for upgrade flow
    - _Requirements: 7.1, 7.3, 7.4_

  - [x] 8.3 Write unit tests for upgrade component
    - Test UpgradeCard rendering and interactions
    - Test upgrade action handlers and navigation
    - Test dismissible behavior and preference storage
    - _Requirements: 7.1, 7.3, 7.4_

- [x] 9. Implement state management and API integration
  - [x] 9.1 Set up TanStack Query for server state management
    - Configure query client with stale-while-revalidate strategy
    - Create base API client with error handling
    - Implement automatic retry logic for failed requests
    - Set up background data synchronization
    - _Requirements: 1.5, 4.5_

  - [x] 9.2 Create Zustand store for client state
    - Build sidebar collapse state management
    - Implement user preferences and settings storage
    - Create notification state management
    - Add theme and accessibility preference handling
    - _Requirements: 2.5, 7.2, 8.2_

  - [x] 9.3 Build comprehensive error handling system
    - Create global error boundary for unhandled exceptions
    - Implement toast notifications for user feedback
    - Add offline state detection and handling
    - Build retry mechanisms for failed operations
    - _Requirements: 1.5, 4.5_

  - [x] 9.4 Write integration tests for state management
    - Test TanStack Query data fetching and caching
    - Test Zustand store state updates and persistence
    - Test error handling and retry mechanisms
    - _Requirements: 1.5, 4.5_

- [x] 10. Add accessibility features and responsive optimizations
  - [x] 10.1 Implement WCAG 2.1 AA compliance features
    - Add proper ARIA labels and descriptions to all components
    - Implement keyboard navigation for all interactive elements
    - Create high contrast mode support
    - Add screen reader optimization and announcements
    - _Requirements: 8.2, 8.4, 8.5_

  - [x] 10.2 Optimize responsive design and mobile experience
    - Fine-tune breakpoint behavior across all components
    - Implement touch-friendly interactions for mobile
    - Add reduced motion preferences support
    - Optimize focus management for modals and dropdowns
    - _Requirements: 8.1, 8.3, 8.4, 8.5_

  - [x] 10.3 Write accessibility and responsive tests
    - Test keyboard navigation across all components
    - Test screen reader compatibility and ARIA labels
    - Test responsive behavior at various breakpoints
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 11. Create main dashboard page and integrate all components
  - [x] 11.1 Build comprehensive dashboard page with all widgets
    - Create main dashboard page at /dashboard route
    - Integrate DashboardStats component with statistics cards
    - Add HiringAnalytics component with hiring sources chart
    - Integrate CalendarWidget and UpcomingInterviews components
    - Add JobsTable component for job management
    - Include UpgradeCard component for plan promotion
    - Implement responsive grid layout with proper spacing
    - Add QueryProvider wrapper for data fetching
    - _Requirements: 1.1, 1.2, 1.3, 3.1, 4.1, 5.1, 6.1, 7.3_

  - [-] 11.2 Implement performance optimizations
    - Add code splitting for dashboard route
    - Implement lazy loading for non-critical components (UpgradeCard, HiringAnalytics)
    - Optimize bundle size with dynamic imports
    - Add loading states and skeleton components for initial page load
    - _Requirements: 8.1, 8.3_

  - [ ] 11.3 Write end-to-end tests for complete dashboard
    - Test complete user workflows and interactions
    - Test data loading and error scenarios
    - Test responsive behavior across devices
    - Test component integration and data flow
    - _Requirements: 1.1, 1.2, 1.3, 3.1, 4.1, 5.1, 6.1, 7.3_
