import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardStats } from '../DashboardStats';
import { mockDashboardStats } from '@/lib/api';

// Mock the API hooks
jest.mock('@/hooks/api', () => ({
  useDashboardStats: jest.fn(),
  useRefreshDashboardStats: jest.fn(),
  statsTransformers: {
    transformForStatsCard: jest.fn(),
    formatCount: (count: number) => count.toLocaleString(),
  },
}));

// Create a test wrapper with QueryClient (named component to satisfy display-name rule)
const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const TestWrapper: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  TestWrapper.displayName = 'DashboardStatsTestWrapper';
  return TestWrapper;
};

describe('DashboardStats', () => {
  const mockUseDashboardStats = require('@/hooks/api').useDashboardStats;
  const mockUseRefreshDashboardStats =
    require('@/hooks/api').useRefreshDashboardStats;
  const mockStatsTransformers = require('@/hooks/api').statsTransformers;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock implementations
    mockUseRefreshDashboardStats.mockReturnValue({
      refreshStats: jest.fn(),
      refreshStatByType: jest.fn(),
      refreshAll: jest.fn(),
    });

    mockStatsTransformers.transformForStatsCard.mockImplementation(
      (data: any, type: any) => ({
        title: type.charAt(0).toUpperCase() + type.slice(1),
        value: data[type].count,
        subtitle: data[type].subtitle,
        trend: data[type].trend ? { data: data[type].trend } : undefined,
        formatValue: (value: number) => value.toLocaleString(),
      })
    );
  });

  it('renders loading state correctly', () => {
    mockUseDashboardStats.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });

    render(<DashboardStats />, { wrapper: createTestWrapper() });

    // Should show loading skeletons
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons).toHaveLength(3);
  });

  it('renders error state correctly', () => {
    const mockError = new Error('Failed to fetch data');
    mockUseDashboardStats.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: mockError,
      refetch: jest.fn(),
      isRefetching: false,
    });

    render(<DashboardStats />, { wrapper: createTestWrapper() });

    expect(screen.getAllByText('Error Loading Statistics')).toHaveLength(3);
    expect(screen.getAllByText('Failed to fetch data')).toHaveLength(3);
    expect(screen.getAllByText('Try Again')).toHaveLength(3);
  });

  it('renders stats data correctly', async () => {
    const mockResponse = {
      data: mockDashboardStats,
      status: 'success' as const,
      timestamp: '2023-01-01T00:00:00Z',
    };

    mockUseDashboardStats.mockReturnValue({
      data: mockResponse,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });

    render(<DashboardStats />, { wrapper: createTestWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Applications')).toBeInTheDocument();
      expect(screen.getByText('Interviews')).toBeInTheDocument();
      expect(screen.getByText('Hired')).toBeInTheDocument();
    });

    // Check if values are displayed
    expect(screen.getByText('1,234')).toBeInTheDocument();
    expect(screen.getByText('89')).toBeInTheDocument();
    expect(screen.getByText('23')).toBeInTheDocument();

    // Check timestamp
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
  });

  it('handles refresh button click', async () => {
    const mockRefreshStats = jest.fn();
    mockUseRefreshDashboardStats.mockReturnValue({
      refreshStats: mockRefreshStats,
      refreshStatByType: jest.fn(),
      refreshAll: jest.fn(),
    });

    const mockResponse = {
      data: mockDashboardStats,
      status: 'success' as const,
      timestamp: '2023-01-01T00:00:00Z',
    };

    mockUseDashboardStats.mockReturnValue({
      data: mockResponse,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });

    render(<DashboardStats showRefreshButton={true} />, {
      wrapper: createTestWrapper(),
    });

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(mockRefreshStats).toHaveBeenCalledTimes(1);
    });
  });

  it('hides refresh button when showRefreshButton is false', () => {
    const mockResponse = {
      data: mockDashboardStats,
      status: 'success' as const,
      timestamp: '2023-01-01T00:00:00Z',
    };

    mockUseDashboardStats.mockReturnValue({
      data: mockResponse,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });

    render(<DashboardStats showRefreshButton={false} />, {
      wrapper: createTestWrapper(),
    });

    expect(screen.queryByText('Refresh')).not.toBeInTheDocument();
    expect(screen.queryByText('Dashboard Statistics')).not.toBeInTheDocument();
  });

  it('shows refreshing state', () => {
    const mockResponse = {
      data: mockDashboardStats,
      status: 'success' as const,
      timestamp: '2023-01-01T00:00:00Z',
    };

    mockUseDashboardStats.mockReturnValue({
      data: mockResponse,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: true,
    });

    render(<DashboardStats />, { wrapper: createTestWrapper() });

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    expect(refreshButton).toBeDisabled();

    // Check for spinning icon
    const spinningIcon = document.querySelector('.animate-spin');
    expect(spinningIcon).toBeInTheDocument();
  });

  it('handles no data state', () => {
    mockUseDashboardStats.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });

    render(<DashboardStats />, { wrapper: createTestWrapper() });

    expect(
      screen.getByText('No statistics data available')
    ).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const mockResponse = {
      data: mockDashboardStats,
      status: 'success' as const,
      timestamp: '2023-01-01T00:00:00Z',
    };

    mockUseDashboardStats.mockReturnValue({
      data: mockResponse,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { container } = render(<DashboardStats className="custom-class" />, {
      wrapper: createTestWrapper(),
    });

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
