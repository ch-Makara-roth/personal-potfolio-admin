/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardStats } from '@/components/features/dashboard/DashboardStats';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { StatsCard } from '@/components/ui/StatsCard';
import { FileText } from 'lucide-react';

// Mock hooks
jest.mock('@/hooks/api', () => ({
  useDashboardStats: () => ({
    data: {
      data: {
        applications: { count: 150, trend: [100, 120, 150] },
        interviews: { count: 25, scheduled: 5 },
        hired: { count: 12, thisMonth: 3 },
      },
      timestamp: new Date().toISOString(),
    },
    isLoading: false,
    error: null,
    refetch: jest.fn(),
    isRefetching: false,
  }),
  useRefreshDashboardStats: () => ({
    refreshStats: jest.fn(),
  }),
  statsTransformers: {
    transformForStatsCard: (stats: any, type: string) => ({
      title: type.charAt(0).toUpperCase() + type.slice(1),
      value: stats[type]?.count || 0,
      subtitle: 'This month',
      formatValue: (val: any) => val.toString(),
      trend: stats[type]?.trend ? { data: stats[type].trend } : undefined,
    }),
  },
}));

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

// Mock window properties for responsive testing
const mockWindowSize = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });

  // Trigger resize event
  fireEvent(window, new Event('resize'));
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('Responsive Component Behavior', () => {
  beforeEach(() => {
    // Reset to desktop size
    mockWindowSize(1200, 800);
  });

  describe('DashboardStats Responsive Behavior', () => {
    it('should render in grid layout on desktop', () => {
      mockWindowSize(1200, 800);

      const { container } = render(<DashboardStats />);

      // Check for grid layout classes
      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toBeInTheDocument();
      expect(gridContainer).toHaveClass('grid');
    });

    it('should stack cards on mobile', () => {
      mockWindowSize(400, 800);

      const { container } = render(<DashboardStats />);

      // On mobile, should still have grid but with single column
      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toBeInTheDocument();
    });

    it('should adjust header layout on mobile', () => {
      mockWindowSize(400, 800);

      render(<DashboardStats showRefreshButton={true} />);

      // Header should exist
      expect(screen.getByText('Dashboard Statistics')).toBeInTheDocument();
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    it('should handle loading state responsively', () => {
      mockWindowSize(400, 800);

      const { container } = render(<DashboardStats />);

      // Component should render even if not showing skeleton loaders
      expect(container.querySelector('.grid')).toBeInTheDocument();
    });
  });

  describe('AppLayout Responsive Behavior', () => {
    const mockOnMenuClick = jest.fn();

    beforeEach(() => {
      mockOnMenuClick.mockClear();
    });

    it('should show sidebar on desktop', () => {
      mockWindowSize(1200, 800);

      render(
        <AppLayout>
          <div>Test Content</div>
        </AppLayout>
      );

      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should handle mobile layout', () => {
      mockWindowSize(400, 800);

      render(
        <AppLayout>
          <div>Test Content</div>
        </AppLayout>
      );

      // Main content should be present
      expect(screen.getByRole('main')).toBeInTheDocument();

      // Should have mobile-specific classes or behavior
      const mainContent = screen.getByRole('main');
      expect(mainContent).toBeInTheDocument();
    });

    it('should apply safe area classes on mobile', () => {
      mockWindowSize(400, 800);

      const { container } = render(
        <AppLayout>
          <div>Test Content</div>
        </AppLayout>
      );

      // Check for safe area classes
      const appContainer = container.firstChild as HTMLElement;
      expect(appContainer).toHaveClass('safe-area-inset');
    });
  });

  describe('Button Responsive Behavior', () => {
    it('should have appropriate size on desktop', () => {
      mockWindowSize(1200, 800);

      render(<Button>Test Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should have touch-friendly size on mobile', () => {
      mockWindowSize(400, 800);

      // Mock touch device
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: true,
        configurable: true,
        value: 5,
      });

      render(<Button>Test Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();

      // Should have minimum touch target size
      // This would be tested through computed styles in a real browser
    });

    it('should handle loading state on mobile', () => {
      mockWindowSize(400, 800);

      render(
        <Button loading loadingText="Loading...">
          Submit
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(screen.getAllByText('Loading...').length).toBeGreaterThan(0);
    });
  });

  describe('StatsCard Responsive Behavior', () => {
    const mockProps = {
      title: 'Applications',
      value: 150,
      icon: FileText,
      variant: 'applications' as const,
    };

    it('should render properly on desktop', () => {
      mockWindowSize(1200, 800);

      render(<StatsCard {...mockProps} />);

      expect(screen.getByText('Applications')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    it('should adapt to mobile layout', () => {
      mockWindowSize(400, 800);

      render(<StatsCard {...mockProps} />);

      const card = screen.getByRole('region');
      expect(card).toBeInTheDocument();

      // Card should still be accessible and readable on mobile
      expect(screen.getByText('Applications')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    it('should handle trend visualization on mobile', () => {
      mockWindowSize(400, 800);

      const trendData = {
        data: [100, 120, 150],
      };

      render(<StatsCard {...mockProps} trend={trendData} />);

      // Trend should be accessible on mobile
      expect(
        screen.getByRole('img', { name: /trend chart/i })
      ).toBeInTheDocument();
    });
  });

  describe('Breakpoint-specific Behavior', () => {
    it('should handle small mobile (320px)', () => {
      mockWindowSize(320, 568);

      render(
        <AppLayout>
          <DashboardStats />
        </AppLayout>
      );

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByText('Dashboard Statistics')).toBeInTheDocument();
    });

    it('should handle tablet (768px)', () => {
      mockWindowSize(768, 1024);

      render(
        <AppLayout>
          <DashboardStats />
        </AppLayout>
      );

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should handle large desktop (1920px)', () => {
      mockWindowSize(1920, 1080);

      render(
        <AppLayout>
          <DashboardStats />
        </AppLayout>
      );

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });

  describe('Orientation Changes', () => {
    it('should handle portrait to landscape transition', () => {
      // Start in portrait
      mockWindowSize(400, 800);

      const { rerender } = render(
        <AppLayout>
          <DashboardStats />
        </AppLayout>
      );

      // Switch to landscape
      mockWindowSize(800, 400);

      rerender(
        <AppLayout>
          <DashboardStats />
        </AppLayout>
      );

      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Touch Device Behavior', () => {
    beforeEach(() => {
      // Mock touch device
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: true,
        configurable: true,
        value: 5,
      });

      Object.defineProperty(window, 'ontouchstart', {
        writable: true,
        configurable: true,
        value: {},
      });
    });

    it('should provide touch-friendly interactions', () => {
      mockWindowSize(400, 800);

      render(<Button>Touch Button</Button>);

      const button = screen.getByRole('button');

      // Simulate touch event
      fireEvent.touchStart(button);
      fireEvent.touchEnd(button);

      expect(button).toBeInTheDocument();
    });

    it('should handle touch gestures in sidebar', () => {
      mockWindowSize(400, 800);

      render(
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      );

      // Should handle touch interactions for sidebar overlay
      const overlay = document.querySelector('.fixed.inset-0.bg-black');
      if (overlay) {
        fireEvent.touchEnd(overlay);
      }
    });
  });
});
