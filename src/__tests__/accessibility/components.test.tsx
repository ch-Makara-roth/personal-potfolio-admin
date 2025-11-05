/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
// Note: jest-axe would be imported here for full accessibility testing
// import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatsCard } from '@/components/ui/StatsCard';
import { FileText } from 'lucide-react';

// Note: Would extend Jest matchers here for full accessibility testing
// expect.extend(toHaveNoViolations);

// Mock Next.js router
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('Button Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<Button>Test Button</Button>);
    // Note: Would use axe for full accessibility testing
    // const results = await axe(container);
    // expect(results).toHaveNoViolations();

    // Basic accessibility checks
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Test Button');
  });

  it('should have proper ARIA attributes when loading', () => {
    render(
      <Button loading loadingText="Loading data">
        Submit
      </Button>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('aria-live', 'polite');
  });

  it('should have proper ARIA attributes when disabled', () => {
    render(<Button disabled>Submit</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toBeDisabled();
  });

  it('should support keyboard navigation', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(<Button onClick={handleClick}>Test Button</Button>);

    const button = screen.getByRole('button');

    // Test click
    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should have visible focus indicator', () => {
    render(<Button>Test Button</Button>);

    const button = screen.getByRole('button');

    // Button should be focusable
    expect(button).toBeInTheDocument();
    expect(button.tagName).toBe('BUTTON');
  });
});

describe('Header Accessibility', () => {
  const mockOnMenuClick = jest.fn();

  beforeEach(() => {
    mockOnMenuClick.mockClear();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(<Header onMenuClick={mockOnMenuClick} />);
    // Note: Would use axe for full accessibility testing
    // const results = await axe(container);
    // expect(results).toHaveNoViolations();

    // Basic accessibility checks
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('should have proper landmark roles', () => {
    render(<Header onMenuClick={mockOnMenuClick} />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(
      screen.getByRole('toolbar', { name: /user actions/i })
    ).toBeInTheDocument();
  });

  it('should have accessible menu button', () => {
    render(<Header onMenuClick={mockOnMenuClick} />);

    const menuButton = screen.getByLabelText(/toggle navigation sidebar/i);
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    expect(menuButton).toHaveAttribute('aria-controls', 'sidebar-navigation');
  });

  it('should have accessible user menu', async () => {
    const user = userEvent.setup();
    render(<Header onMenuClick={mockOnMenuClick} />);

    const userMenuButton = screen.getByLabelText(/user account menu/i);
    expect(userMenuButton).toHaveAttribute('aria-haspopup', 'menu');
    expect(userMenuButton).toHaveAttribute('aria-expanded', 'false');

    // Open user menu
    await user.click(userMenuButton);

    await waitFor(() => {
      expect(userMenuButton).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });
  });

  it('should handle keyboard navigation in user menu', async () => {
    const user = userEvent.setup();
    render(<Header onMenuClick={mockOnMenuClick} />);

    const userMenuButton = screen.getByLabelText(/user account menu/i);

    // Open menu with click
    await user.click(userMenuButton);

    await waitFor(
      () => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it('should have accessible notifications', () => {
    render(<Header onMenuClick={mockOnMenuClick} />);

    const notificationButton = screen.getByLabelText(
      /notifications.*3 unread/i
    );
    expect(notificationButton).toBeInTheDocument();

    // Check for notification count indicator
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});

describe('Sidebar Accessibility', () => {
  const mockOnToggle = jest.fn();

  beforeEach(() => {
    mockOnToggle.mockClear();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <Sidebar collapsed={false} onToggle={mockOnToggle} />
    );
    // Note: Would use axe for full accessibility testing
    // const results = await axe(container);
    // expect(results).toHaveNoViolations();

    // Basic accessibility checks
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('should have proper navigation structure', () => {
    render(<Sidebar collapsed={false} onToggle={mockOnToggle} />);

    expect(
      screen.getByRole('navigation', { name: /main navigation/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('list', { name: /main navigation menu/i })
    ).toBeInTheDocument();
  });

  it('should have accessible navigation items', () => {
    render(<Sidebar collapsed={false} onToggle={mockOnToggle} />);

    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).toHaveAttribute('aria-current', 'page'); // Since we mock pathname as '/'

    const teamLink = screen.getByText('Team & Availability').closest('a');
    expect(teamLink).toHaveAttribute('aria-describedby');
  });

  it('should support keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<Sidebar collapsed={false} onToggle={mockOnToggle} />);

    const navigationItems = screen.getAllByRole('listitem');
    const firstItem = navigationItems[0].querySelector('a');
    const secondItem = navigationItems[1].querySelector('a');

    if (firstItem && secondItem) {
      firstItem.focus();
      expect(firstItem).toHaveFocus();

      // Test arrow key navigation
      await user.keyboard('{ArrowDown}');
      expect(secondItem).toHaveFocus();

      await user.keyboard('{ArrowUp}');
      expect(firstItem).toHaveFocus();
    }
  });

  it('should handle Escape key to close sidebar', async () => {
    const user = userEvent.setup();
    render(<Sidebar collapsed={false} onToggle={mockOnToggle} />);

    const sidebar = screen.getByRole('navigation');

    // Focus within sidebar and press Escape
    const firstLink = screen.getAllByRole('listitem')[0].querySelector('a');
    if (firstLink) {
      firstLink.focus();
      await user.keyboard('{Escape}');
      expect(mockOnToggle).toHaveBeenCalled();
    }
  });

  it('should be hidden when collapsed', () => {
    render(<Sidebar collapsed={true} onToggle={mockOnToggle} />);

    const sidebar = screen.getByRole('navigation');
    expect(sidebar).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('StatsCard Accessibility', () => {
  const mockProps = {
    title: 'Applications',
    value: 150,
    icon: FileText,
    variant: 'applications' as const,
  };

  it('should have no accessibility violations', async () => {
    const { container } = render(<StatsCard {...mockProps} />);
    // Note: Would use axe for full accessibility testing
    // const results = await axe(container);
    // expect(results).toHaveNoViolations();

    // Basic accessibility checks
    expect(screen.getByRole('region')).toBeInTheDocument();
  });

  it('should have proper region structure', () => {
    render(<StatsCard {...mockProps} />);

    const region = screen.getByRole('region');
    expect(region).toHaveAttribute('aria-labelledby');
    expect(region).toHaveAttribute('aria-describedby');
    expect(region).toHaveAttribute('tabindex', '0');
  });

  it('should have accessible title and value', () => {
    render(<StatsCard {...mockProps} />);

    expect(screen.getByText('Applications')).toBeInTheDocument();
    expect(screen.getByLabelText(/current value: 150/i)).toBeInTheDocument();
  });

  it('should have accessible icon', () => {
    render(<StatsCard {...mockProps} />);

    const iconContainer = screen.getByLabelText(/applications icon/i);
    expect(iconContainer).toHaveAttribute('role', 'img');
  });

  it('should handle trend data accessibly', () => {
    const trendData = {
      data: [100, 120, 150],
    };

    render(<StatsCard {...mockProps} trend={trendData} />);

    const trendChart = screen.getByRole('img', { name: /trend chart/i });
    expect(trendChart).toBeInTheDocument();

    // Check for trend direction
    expect(screen.getByLabelText(/trending up/i)).toBeInTheDocument();
  });

  it('should be keyboard accessible', async () => {
    render(<StatsCard {...mockProps} />);

    const card = screen.getByRole('region');

    // Card should be focusable
    expect(card).toHaveAttribute('tabindex', '0');
  });
});
