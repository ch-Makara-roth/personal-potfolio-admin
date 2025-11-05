# Technology Stack - UI Layout & API Integration Focus

## Frontend-First Development Stack

### Core Technologies

- **React 18+** with hooks and modern patterns
- **TypeScript** for type safety and better DX
- **Next.js 14+** for SSR, routing, and optimization
- **Tailwind CSS** for utility-first styling and responsive design

### UI Component Libraries

- **Headless UI** or **Radix UI** for accessible primitives
- **Lucide React** or **Heroicons** for consistent iconography
- **Framer Motion** for smooth animations and transitions
- **React Hook Form** for performant form handling

### API Integration & State Management

- **TanStack Query (React Query)** for server state management
- **Zustand** or **Context API** for client state
- **Axios** or **Fetch API** for HTTP requests
- **React Error Boundary** for error handling

### Development Tools

- **Vite** or **Next.js** for fast development builds
- **Storybook** for component development and documentation
- **ESLint + Prettier** for code quality
- **TypeScript strict mode** enabled

## API Integration Patterns

### Data Fetching

```typescript
// Use React Query for server state
const { data, isLoading, error } = useQuery({
  queryKey: ['portfolio', id],
  queryFn: () => fetchPortfolio(id),
});

// Custom hooks for API operations
const useCreateProject = () => {
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => queryClient.invalidateQueries(['projects']),
  });
};
```

### Authentication

- **JWT token storage** in httpOnly cookies or secure localStorage
- **Axios interceptors** for automatic token attachment
- **Protected route components** with authentication checks

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript checking
npm run storybook    # Start Storybook
```

## UI Development Priorities

- Component-driven development
- Design system consistency
- Responsive breakpoints (mobile-first)
- Loading states and error boundaries
- Accessibility compliance (ARIA, keyboard navigation)
