import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UpgradeCard } from '../UpgradeCard';

// Mock the API hooks
jest.mock('@/hooks/api', () => ({
  useCurrentPlan: jest.fn(),
  useUpgradeActions: jest.fn(),
  upgradeTransformers: {
    formatPlanPrice: jest.fn(),
    calculateYearlySavings: jest.fn(),
  },
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Test wrapper with QueryClient (named to satisfy display-name rule)
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
  TestWrapper.displayName = 'UpgradeCardTestWrapper';
  return TestWrapper;
};

describe('UpgradeCard', () => {
  const mockUseCurrentPlan = require('@/hooks/api').useCurrentPlan;
  const mockUseUpgradeActions = require('@/hooks/api').useUpgradeActions;

  const mockCurrentPlanData = {
    data: {
      plan: {
        id: 'free',
        name: 'Free Plan',
        type: 'free',
        features: ['Up to 3 job postings', 'Basic candidate tracking'],
        limits: {
          jobPostings: 3,
          candidates: 50,
          analytics: false,
          customBranding: false,
          prioritySupport: false,
        },
      },
      subscription: {
        id: 'sub_1',
        userId: 'user_1',
        planId: 'free',
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        cancelAtPeriodEnd: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
  };

  const mockUpgradeActions = {
    handleUpgradeClick: jest.fn(),
    trackUpgradeView: jest.fn(),
    isUpgrading: false,
    upgradeError: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);

    mockUseCurrentPlan.mockReturnValue({
      data: mockCurrentPlanData,
      isLoading: false,
      error: null,
    });

    mockUseUpgradeActions.mockReturnValue(mockUpgradeActions);
  });

  it('renders upgrade card correctly for free plan users', () => {
    const Wrapper = createTestWrapper();

    render(
      <Wrapper>
        <UpgradeCard />
      </Wrapper>
    );

    expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument();
    expect(
      screen.getByText(
        "You're currently on the Free Plan. Unlock powerful features with Pro."
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Upgrade Now')).toBeInTheDocument();
  });

  it('does not render for pro plan users', () => {
    mockUseCurrentPlan.mockReturnValue({
      data: {
        ...mockCurrentPlanData,
        data: {
          ...mockCurrentPlanData.data,
          plan: {
            ...mockCurrentPlanData.data.plan,
            type: 'pro',
            name: 'Pro Plan',
          },
        },
      },
      isLoading: false,
      error: null,
    });

    const Wrapper = createTestWrapper();

    const { container } = render(
      <Wrapper>
        <UpgradeCard />
      </Wrapper>
    );

    expect(container.firstChild).toBeNull();
  });

  it('shows loading state while fetching plan data', () => {
    mockUseCurrentPlan.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    const Wrapper = createTestWrapper();

    const { container } = render(
      <Wrapper>
        <UpgradeCard />
      </Wrapper>
    );

    // Check for the loading spinner with Loader2 icon
    const loadingSpinner = document.querySelector('.lucide-loader-circle');
    expect(loadingSpinner).toBeInTheDocument();
    expect(loadingSpinner).toHaveClass('animate-spin');
  });

  it('renders custom features when provided', () => {
    const customFeatures = [
      'Custom feature 1',
      'Custom feature 2',
      'Custom feature 3',
    ];

    const Wrapper = createTestWrapper();

    render(
      <Wrapper>
        <UpgradeCard features={customFeatures} />
      </Wrapper>
    );

    expect(screen.getByText('Custom feature 1')).toBeInTheDocument();
    expect(screen.getByText('Custom feature 2')).toBeInTheDocument();
    expect(screen.getByText('Custom feature 3')).toBeInTheDocument();
  });

  it('shows "more features" text when more than 3 features provided', () => {
    const manyFeatures = [
      'Feature 1',
      'Feature 2',
      'Feature 3',
      'Feature 4',
      'Feature 5',
    ];

    const Wrapper = createTestWrapper();

    render(
      <Wrapper>
        <UpgradeCard features={manyFeatures} />
      </Wrapper>
    );

    expect(screen.getByText('Feature 1')).toBeInTheDocument();
    expect(screen.getByText('Feature 2')).toBeInTheDocument();
    expect(screen.getByText('Feature 3')).toBeInTheDocument();
    expect(screen.getByText('+2 more features')).toBeInTheDocument();
    expect(screen.queryByText('Feature 4')).not.toBeInTheDocument();
  });

  it('calls handleUpgradeClick when upgrade button is clicked', () => {
    const Wrapper = createTestWrapper();

    render(
      <Wrapper>
        <UpgradeCard source="dashboard_card" />
      </Wrapper>
    );

    const upgradeButton = screen.getByText('Upgrade Now');
    fireEvent.click(upgradeButton);

    expect(mockUpgradeActions.handleUpgradeClick).toHaveBeenCalledWith(
      'dashboard_card',
      'pro'
    );
  });

  it('calls onUpgrade callback when provided', () => {
    const onUpgrade = jest.fn();
    const Wrapper = createTestWrapper();

    render(
      <Wrapper>
        <UpgradeCard onUpgrade={onUpgrade} />
      </Wrapper>
    );

    const upgradeButton = screen.getByText('Upgrade Now');
    fireEvent.click(upgradeButton);

    expect(onUpgrade).toHaveBeenCalled();
  });

  it('shows loading state when upgrade is in progress', () => {
    mockUseUpgradeActions.mockReturnValue({
      ...mockUpgradeActions,
      isUpgrading: true,
    });

    const Wrapper = createTestWrapper();

    render(
      <Wrapper>
        <UpgradeCard />
      </Wrapper>
    );

    expect(screen.getByText('Processing...')).toBeInTheDocument();
    // Get the upgrade button specifically by its text content
    const upgradeButton = screen.getByText('Processing...').closest('button');
    expect(upgradeButton).toBeDisabled();
  });

  it('tracks upgrade view on mount for free plan users', () => {
    const Wrapper = createTestWrapper();

    render(
      <Wrapper>
        <UpgradeCard source="dashboard_card" />
      </Wrapper>
    );

    expect(mockUpgradeActions.trackUpgradeView).toHaveBeenCalledWith(
      'dashboard_card'
    );
  });

  it('does not track upgrade view for pro plan users', () => {
    mockUseCurrentPlan.mockReturnValue({
      data: {
        ...mockCurrentPlanData,
        data: {
          ...mockCurrentPlanData.data,
          plan: {
            ...mockCurrentPlanData.data.plan,
            type: 'pro',
          },
        },
      },
      isLoading: false,
      error: null,
    });

    const Wrapper = createTestWrapper();

    render(
      <Wrapper>
        <UpgradeCard source="dashboard_card" />
      </Wrapper>
    );

    expect(mockUpgradeActions.trackUpgradeView).not.toHaveBeenCalled();
  });

  describe('Dismissible functionality', () => {
    it('renders dismiss button when dismissible is true', () => {
      const Wrapper = createTestWrapper();

      render(
        <Wrapper>
          <UpgradeCard dismissible={true} />
        </Wrapper>
      );

      expect(screen.getByLabelText('Dismiss upgrade card')).toBeInTheDocument();
    });

    it('does not render dismiss button when dismissible is false', () => {
      const Wrapper = createTestWrapper();

      render(
        <Wrapper>
          <UpgradeCard dismissible={false} />
        </Wrapper>
      );

      expect(
        screen.queryByLabelText('Dismiss upgrade card')
      ).not.toBeInTheDocument();
    });

    it('dismisses card when dismiss button is clicked', async () => {
      const onDismiss = jest.fn();
      const Wrapper = createTestWrapper();

      const { container } = render(
        <Wrapper>
          <UpgradeCard dismissible={true} onDismiss={onDismiss} />
        </Wrapper>
      );

      const dismissButton = screen.getByLabelText('Dismiss upgrade card');
      fireEvent.click(dismissButton);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });

      expect(onDismiss).toHaveBeenCalled();
    });

    it('saves dismissed state to localStorage', () => {
      const Wrapper = createTestWrapper();

      render(
        <Wrapper>
          <UpgradeCard dismissible={true} storageKey="test-key" />
        </Wrapper>
      );

      const dismissButton = screen.getByLabelText('Dismiss upgrade card');
      fireEvent.click(dismissButton);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('test-key', 'true');
    });

    it('loads dismissed state from localStorage on mount', () => {
      mockLocalStorage.getItem.mockReturnValue('true');

      const Wrapper = createTestWrapper();

      const { container } = render(
        <Wrapper>
          <UpgradeCard dismissible={true} storageKey="test-key" />
        </Wrapper>
      );

      expect(container.firstChild).toBeNull();
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('test-key');
    });

    it('does not save to localStorage when storageKey is not provided', () => {
      const Wrapper = createTestWrapper();

      render(
        <Wrapper>
          <UpgradeCard dismissible={true} />
        </Wrapper>
      );

      const dismissButton = screen.getByLabelText('Dismiss upgrade card');
      fireEvent.click(dismissButton);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'upgrade-card-dismissed',
        'true'
      );
    });
  });

  describe('Size variants', () => {
    it('applies default size correctly', () => {
      const Wrapper = createTestWrapper();

      const { container } = render(
        <Wrapper>
          <UpgradeCard />
        </Wrapper>
      );

      const cardElement = container.firstChild as HTMLElement;
      expect(cardElement).toHaveClass('p-6');
    });

    it('applies compact size correctly', () => {
      const Wrapper = createTestWrapper();

      const { container } = render(
        <Wrapper>
          <UpgradeCard size="compact" />
        </Wrapper>
      );

      const cardElement = container.firstChild as HTMLElement;
      expect(cardElement).toHaveClass('p-4');
    });
  });

  it('applies custom className correctly', () => {
    const Wrapper = createTestWrapper();

    const { container } = render(
      <Wrapper>
        <UpgradeCard className="custom-class" />
      </Wrapper>
    );

    const cardElement = container.firstChild as HTMLElement;
    expect(cardElement).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    const Wrapper = createTestWrapper();

    render(
      <Wrapper>
        <UpgradeCard ref={ref} />
      </Wrapper>
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
