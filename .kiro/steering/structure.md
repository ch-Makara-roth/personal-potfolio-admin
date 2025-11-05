# Project Structure - UI Layout & API Integration

## Frontend-Focused Folder Organization

### Root Level

```
/
├── src/                 # Source code
├── public/              # Static assets (images, icons, fonts)
├── components/          # Storybook stories (optional)
├── .kiro/               # Kiro configuration
├── package.json         # Dependencies and scripts
├── tailwind.config.js   # Tailwind CSS configuration
├── next.config.js       # Next.js configuration
└── .env.example         # API endpoints and environment variables
```

### Source Code Structure (UI-First)

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base design system components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── Card.tsx
│   ├── layout/         # Layout and navigation
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── Navigation.tsx
│   │   └── PageLayout.tsx
│   └── features/       # Feature-specific components
│       ├── portfolio/  # Portfolio management UI
│       ├── dashboard/  # Dashboard widgets
│       ├── media/      # Media management UI
│       └── auth/       # Authentication forms
├── pages/              # Next.js pages/routes
├── hooks/              # Custom React hooks
│   ├── api/           # API integration hooks
│   ├── ui/            # UI-specific hooks
│   └── auth/          # Authentication hooks
├── lib/                # API clients and configurations
│   ├── api.ts         # Axios/fetch configuration
│   ├── auth.ts        # Authentication utilities
│   └── query-client.ts # React Query setup
├── types/              # TypeScript definitions
│   ├── api.ts         # API response types
│   ├── ui.ts          # UI component types
│   └── auth.ts        # Authentication types
├── utils/              # Utility functions
└── styles/             # Global styles and Tailwind imports
```

### Component Organization Pattern

```
components/
├── ui/                 # Atomic design system components
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.stories.tsx
│   │   └── index.ts
│   └── Card/
│       ├── Card.tsx
│       ├── Card.stories.tsx
│       └── index.ts
└── features/           # Composed feature components
    ├── portfolio/
    │   ├── ProjectCard.tsx
    │   ├── ProjectGrid.tsx
    │   └── ProjectForm.tsx
    └── dashboard/
        ├── StatsWidget.tsx
        └── RecentActivity.tsx
```

## Naming Conventions

### Files and Folders

- **PascalCase** for React components: `ProjectCard.tsx`
- **camelCase** for hooks and utilities: `usePortfolio.ts`, `formatDate.ts`
- **kebab-case** for pages: `project-details.tsx`
- **UPPER_CASE** for constants: `API_ENDPOINTS.ts`

### API Integration Naming

- API hooks: `useGetProjects`, `useCreateProject`
- API types: `ProjectResponse`, `CreateProjectRequest`
- API utilities: `apiClient`, `authHeaders`

## Import Organization (UI-Focused)

```typescript
// 1. React and Next.js
import React from 'react';
import { NextPage } from 'next';

// 2. External UI libraries
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';

// 3. Internal API hooks and utilities
import { useGetProjects } from '@/hooks/api/useProjects';
import { formatDate } from '@/utils/date';

// 4. UI components (atomic to composed)
import { Button } from '@/components/ui/Button';
import { ProjectCard } from '@/components/features/portfolio/ProjectCard';

// 5. Types
import type { Project } from '@/types/api';
```

## API Integration Structure

```
src/lib/
├── api/
│   ├── client.ts       # Base API client setup
│   ├── endpoints.ts    # API endpoint constants
│   ├── portfolio.ts    # Portfolio API functions
│   ├── auth.ts         # Authentication API
│   └── media.ts        # Media upload API
└── hooks/
    ├── useApi.ts       # Generic API hook
    ├── useAuth.ts      # Authentication hook
    └── useUpload.ts    # File upload hook
```

## Environment Configuration

- `.env.local` - Local development API endpoints
- `.env.example` - Template with required environment variables
- API base URLs, authentication endpoints, and feature flags
