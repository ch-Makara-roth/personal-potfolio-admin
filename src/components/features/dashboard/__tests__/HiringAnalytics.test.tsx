import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HiringAnalytics from '../HiringAnalytics';
import * as useHiringSourcesModule from '@/hooks/api/useHiringSources';

// Mock the useHiringSourcesRealTime hook
const mockUseHiringSourcesRealTime = jest.fn();

jest.mock('@/hooks/api/useHiringSources', () => ({
  ...jest.requireActual('@/hooks/api/useHiringSources'),
  useHiringSourcesRealTime: () => mockUseHiringSourcesRealTime(),
}));

// Mock data
const mockHiringSourcesData = {
  sources: [
    {
      id: '1',
      source: 'Direct',
      value: 85,
      category: 'design' as const,
    },
    {
      id: '2',
      source: 'Dribbble',
      value: 65,
      category: 'design' as const,
    },
    {
      id: '3',
      source: 'LinkedIn',
      value: 45,
      category: 'engineering' as const,
    },
  ],
  categories: {
    design: { label: 'Design', color: '#1E40AF' },
    engineering: { label: 'Engineering', color: '#EA580C' },
    marketing: { label: 'Marketing', color: '#0891B2' },
  },
  lastUpdated: '2024-01-01T12:00:00Z',
};

// Test wrapper with QueryClient
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('HiringAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    mockUseHiringSourcesRealTime.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refresh: jest.fn(),
      lastUpdated: null,
    });

    render(
      <TestWrapper>
        <HiringAnalytics />
      </TestWrapper>
    );

    // Check for loading skeleton elements
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();

    // Should show skeleton bars
    const skeletonBars = document.querySelectorAll('.bg-gray-200');
    expect(skeletonBars.length).toBeGreaterThan(0);
  });

  it('renders error state with retry button', () => {
    const mockRefresh = jest.fn();
    const mockError = new Error('Failed to fetch data');

    mockUseHiringSourcesRealTime.mockReturnValue({
      data: null,
      isLoading: false,
      error: mockError,
      refresh: mockRefresh,
      lastUpdated: null,
    });

    render(
      <TestWrapper>
        <HiringAnalytics />
      </TestWrapper>
    );

    expect(
      screen.getByText('Failed to load hiring sources data')
    ).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch data')).toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: /try again/i });
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when no data available', () => {
    mockUseHiringSourcesRealTime.mockReturnValue({
      data: {
        sources: [],
        categories: {},
        lastUpdated: '2024-01-01T12:00:00Z',
      },
      isLoading: false,
      error: null,
      refresh: jest.fn(),
      lastUpdated: '2024-01-01T12:00:00Z',
    });

    render(
      <TestWrapper>
        <HiringAnalytics />
      </TestWrapper>
    );

    expect(
      screen.getByText('No hiring sources data available at the moment.')
    ).toBeInTheDocument();
  });

  it('renders chart with data successfully', () => {
    mockUseHiringSourcesRealTime.mockReturnValue({
      data: mockHiringSourcesData,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
      lastUpdated: '2024-01-01T12:00:00Z',
    });

    render(
      <TestWrapper>
        <HiringAnalytics />
      </TestWrapper>
    );

    expect(screen.getByText('Top Hiring Sources')).toBeInTheDocument();
    expect(screen.getByText('Direct')).toBeInTheDocument();
    expect(screen.getByText('Dribbble')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
  });

  it('displays last updated time and refresh button', () => {
    const mockRefresh = jest.fn();

    mockUseHiringSourcesRealTime.mockReturnValue({
      data: mockHiringSourcesData,
      isLoading: false,
      error: null,
      refresh: mockRefresh,
      lastUpdated: '2024-01-01T12:00:00Z',
    });

    render(
      <TestWrapper>
        <HiringAnalytics />
      </TestWrapper>
    );

    expect(screen.getByText(/last updated:/i)).toBeInTheDocument();

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    expect(refreshButton).toBeInTheDocument();

    fireEvent.click(refreshButton);
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it('passes custom props to HiringSourcesChart', () => {
    mockUseHiringSourcesRealTime.mockReturnValue({
      data: mockHiringSourcesData,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
      lastUpdated: '2024-01-01T12:00:00Z',
    });

    render(
      <TestWrapper>
        <HiringAnalytics
          title="Custom Analytics Title"
          maxValue={200}
          showLegend={false}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Custom Analytics Title')).toBeInTheDocument();
    expect(screen.getByText('Scale: 0-200')).toBeInTheDocument();

    // Legend should be hidden
    expect(screen.queryByText('Design')).not.toBeInTheDocument();
  });

  it('handles real-time updates configuration', () => {
    mockUseHiringSourcesRealTime.mockReturnValue({
      data: mockHiringSourcesData,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
      lastUpdated: '2024-01-01T12:00:00Z',
    });

    render(
      <TestWrapper>
        <HiringAnalytics enableRealTime={false} refreshInterval={60000} />
      </TestWrapper>
    );

    // Test that the component renders correctly with custom configuration
    expect(screen.getByText('Top Hiring Sources')).toBeInTheDocument();
    expect(screen.getByText('Direct')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    mockUseHiringSourcesRealTime.mockReturnValue({
      data: mockHiringSourcesData,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
      lastUpdated: '2024-01-01T12:00:00Z',
    });

    render(
      <TestWrapper>
        <HiringAnalytics className="custom-class" />
      </TestWrapper>
    );

    const container = document.querySelector('.custom-class');
    expect(container).toBeInTheDocument();
  });

  it('handles null data gracefully', () => {
    mockUseHiringSourcesRealTime.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
      lastUpdated: null,
    });

    render(
      <TestWrapper>
        <HiringAnalytics />
      </TestWrapper>
    );

    expect(
      screen.getByText('No hiring sources data available at the moment.')
    ).toBeInTheDocument();
  });

  it('shows loading skeleton with correct structure', () => {
    mockUseHiringSourcesRealTime.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refresh: jest.fn(),
      lastUpdated: null,
    });

    render(
      <TestWrapper>
        <HiringAnalytics title="Loading Test" />
      </TestWrapper>
    );

    // Check skeleton structure
    // Check skeleton structure
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(7);

    // Should have header skeleton
    const headerSkeleton = document.querySelector('.h-6.w-48');
    expect(headerSkeleton).toBeInTheDocument();
  });

  it('error state shows correct error message', () => {
    const customError = new Error('Network timeout');

    mockUseHiringSourcesRealTime.mockReturnValue({
      data: null,
      isLoading: false,
      error: customError,
      refresh: jest.fn(),
      lastUpdated: null,
    });

    render(
      <TestWrapper>
        <HiringAnalytics title="Error Test" />
      </TestWrapper>
    );

    expect(screen.getByText('Error Test')).toBeInTheDocument();
    expect(screen.getByText('Network timeout')).toBeInTheDocument();
    expect(
      screen.getByText('Failed to load hiring sources data')
    ).toBeInTheDocument();
  });

  it('refresh button has correct accessibility attributes', () => {
    mockUseHiringSourcesRealTime.mockReturnValue({
      data: mockHiringSourcesData,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
      lastUpdated: '2024-01-01T12:00:00Z',
    });

    render(
      <TestWrapper>
        <HiringAnalytics />
      </TestWrapper>
    );

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    expect(refreshButton).toHaveAttribute('title', 'Refresh data');
  });

  it('formats last updated time correctly', () => {
    mockUseHiringSourcesRealTime.mockReturnValue({
      data: mockHiringSourcesData,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
      lastUpdated: '2024-01-01T12:00:00Z',
    });

    render(
      <TestWrapper>
        <HiringAnalytics />
      </TestWrapper>
    );

    // Should show formatted time (exact format depends on locale)
    const lastUpdatedText = screen.getByText(/last updated:/i);
    expect(lastUpdatedText).toBeInTheDocument();
    expect(lastUpdatedText.textContent).toMatch(/\d{1,2}:\d{2}:\d{2}/); // Time format
  });
});
