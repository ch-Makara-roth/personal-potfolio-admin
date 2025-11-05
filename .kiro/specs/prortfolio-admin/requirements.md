# Requirements Document

## Introduction

The CONSULT hiring analytics dashboard is a modern, minimalist web application that provides comprehensive hiring statistics and management tools for recruitment teams. The dashboard features a purple-blue color theme with clean, responsive design elements including rounded corners, subtle gradients, and intuitive navigation. The interface displays key hiring metrics, upcoming interviews, job postings, and analytics in an organized, visually appealing layout optimized for both desktop and mobile viewing.

## Requirements

### Requirement 1

**User Story:** As a hiring manager, I want to view key hiring statistics at a glance, so that I can quickly assess recruitment performance and make data-driven decisions.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the system SHALL display application count with document icon and arched line graph
2. WHEN the dashboard loads THEN the system SHALL display interview count with blue circle icon
3. WHEN the dashboard loads THEN the system SHALL display hired count with light blue check icon
4. WHEN viewing statistics THEN the system SHALL present data in rounded cards with purple borders and gradients
5. IF statistics are updated THEN the system SHALL refresh the display in real-time

### Requirement 2

**User Story:** As a recruitment coordinator, I want to navigate between different sections of the application, so that I can efficiently manage various aspects of the hiring process.

#### Acceptance Criteria

1. WHEN accessing the application THEN the system SHALL display a left sidebar with navigation options
2. WHEN viewing navigation THEN the system SHALL show Home, Team & Availability, Services, Clients, Settings, and Notifications options
3. WHEN hovering over navigation items THEN the system SHALL provide visual feedback with light blue icons
4. WHEN Team & Availability is displayed THEN the system SHALL show a number badge (e.g., 1,436)
5. IF the user clicks a navigation item THEN the system SHALL navigate to the corresponding section

### Requirement 3

**User Story:** As a hiring manager, I want to view upcoming interviews in a organized format, so that I can prepare for scheduled candidate meetings.

#### Acceptance Criteria

1. WHEN viewing the dashboard THEN the system SHALL display an "Upcoming Interviews" section
2. WHEN interviews are listed THEN the system SHALL show candidate avatar, name, role, and time badge for each interview
3. WHEN displaying interview cards THEN the system SHALL stack them vertically with clear visual separation
4. WHEN showing time information THEN the system SHALL use light blue badges (e.g., 10:00-12:45)
5. IF no interviews are scheduled THEN the system SHALL display an appropriate empty state message

### Requirement 4

**User Story:** As a recruitment analyst, I want to view hiring source analytics, so that I can identify the most effective recruitment channels.

#### Acceptance Criteria

1. WHEN viewing analytics THEN the system SHALL display a "Top Hiring Sources" horizontal bar chart
2. WHEN showing the chart THEN the system SHALL include y-axis scale (0-100) and x-axis labels (Direct, Dribbble, LinkedIn)
3. WHEN displaying bars THEN the system SHALL use varied colors: dark blue (tallest), cyan (medium), orange (short)
4. WHEN showing legend THEN the system SHALL include Design (blue), Engineering (orange), Marketing (cyan) categories
5. IF data is updated THEN the system SHALL refresh the chart visualization

### Requirement 5

**User Story:** As a hiring coordinator, I want to view and manage current job openings, so that I can track application progress and posting dates.

#### Acceptance Criteria

1. WHEN viewing job management THEN the system SHALL display a "Current Jobs Open" table
2. WHEN showing job listings THEN the system SHALL include columns for Job Title, Applications, Date Posted, and Options
3. WHEN displaying applications THEN the system SHALL show count with file icon (e.g., 92 apps)
4. WHEN showing dates THEN the system SHALL display posting date with calendar icon (e.g., Apr 21, 2024)
5. WHEN viewing options THEN the system SHALL provide action menu with dots icon

### Requirement 6

**User Story:** As a user, I want to view calendar information and navigate between months, so that I can track hiring activities over time.

#### Acceptance Criteria

1. WHEN viewing the dashboard THEN the system SHALL display a calendar widget showing current month
2. WHEN showing calendar THEN the system SHALL highlight specific dates with blue dots (e.g., 16th)
3. WHEN navigating months THEN the system SHALL provide left/right arrows for month selection
4. WHEN displaying calendar THEN the system SHALL show month and year clearly (e.g., November 2020)
5. IF dates have events THEN the system SHALL visually indicate them with colored highlights

### Requirement 7

**User Story:** As a user, I want to access account information and upgrade options, so that I can manage my subscription and profile settings.

#### Acceptance Criteria

1. WHEN viewing the header THEN the system SHALL display "Free Plan" badge in light blue
2. WHEN accessing user options THEN the system SHALL show notification bell icon and user avatar dropdown
3. WHEN viewing upgrade options THEN the system SHALL display "Upgrade to Pro" promo card with rocket icon
4. WHEN clicking upgrade THEN the system SHALL show purple "Upgrade Now" button
5. IF notifications exist THEN the system SHALL indicate them on the bell icon

### Requirement 8

**User Story:** As a user on any device, I want the interface to be responsive and accessible, so that I can use the application effectively regardless of screen size or accessibility needs.

#### Acceptance Criteria

1. WHEN accessing on mobile devices THEN the system SHALL adapt layout for smaller screens
2. WHEN using the interface THEN the system SHALL maintain WCAG compliance standards
3. WHEN viewing on different screen sizes THEN the system SHALL preserve functionality and readability
4. WHEN using keyboard navigation THEN the system SHALL provide proper focus indicators
5. IF using screen readers THEN the system SHALL provide appropriate ARIA labels and descriptions

### Requirement 9

**User Story:** As a user, I want the interface to follow consistent design patterns, so that I have a cohesive and professional experience.

#### Acceptance Criteria

1. WHEN viewing any interface element THEN the system SHALL use purple (#6B46C1 to #A78BFA) and blue (#3182CE to #CBD5E0) color palette
2. WHEN displaying cards and elements THEN the system SHALL apply rounded corners consistently
3. WHEN showing interactive elements THEN the system SHALL provide subtle shadows and frosted glass effects
4. WHEN displaying text THEN the system SHALL use clean sans-serif typography
5. WHEN arranging content THEN the system SHALL maintain ample whitespace for visual clarity
