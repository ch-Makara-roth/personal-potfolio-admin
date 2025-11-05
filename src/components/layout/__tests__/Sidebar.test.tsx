import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '../Sidebar';

// Mock Next.js usePathname hook
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

// Mock the UI components
jest.mock('../../ui/Badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  ),
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('Sidebar', () => {
  const mockOnToggle = jest.fn();

  beforeEach(() => {
    mockOnToggle.mockClear();
    mockUsePathname.mockReturnValue('/');
  });

  it('renders all navigation items', () => {
    render(<Sidebar collapsed={false} onToggle={mockOnToggle} />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Team & Availability')).toBeInTheDocument();
    expect(screen.getByText('Services')).toBeInTheDocument();
    expect(screen.getByText('Clients')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('renders badge for Team & Availability', () => {
    render(<Sidebar collapsed={false} onToggle={mockOnToggle} />);

    const badge = screen.getByTestId('badge');
    expect(badge).toHaveTextContent('1,436');
    expect(badge).toHaveAttribute('data-variant', 'secondary');
  });

  it('highlights active navigation item', () => {
    mockUsePathname.mockReturnValue('/team');
    render(<Sidebar collapsed={false} onToggle={mockOnToggle} />);

    const teamLink = screen.getByText('Team & Availability').closest('a');
    expect(teamLink).toHaveClass(
      'bg-purple-50',
      'text-purple-700',
      'border',
      'border-purple-200'
    );
  });

  it('applies correct classes when collapsed', () => {
    const { container } = render(
      <Sidebar collapsed={true} onToggle={mockOnToggle} />
    );

    const sidebar = container.querySelector('aside');
    expect(sidebar).toHaveClass(
      '-translate-x-full',
      'lg:translate-x-0',
      'lg:w-0'
    );
  });

  it('applies correct classes when expanded', () => {
    const { container } = render(
      <Sidebar collapsed={false} onToggle={mockOnToggle} />
    );

    const sidebar = container.querySelector('aside');
    expect(sidebar).toHaveClass('translate-x-0', 'w-64');
  });

  it('calls onToggle when close button is clicked', () => {
    render(<Sidebar collapsed={false} onToggle={mockOnToggle} />);

    const closeButton = screen.getByLabelText('Close sidebar');
    fireEvent.click(closeButton);

    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it('renders mobile close button and navigation header', () => {
    render(<Sidebar collapsed={false} onToggle={mockOnToggle} />);

    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByLabelText('Close sidebar')).toBeInTheDocument();
  });

  it('renders footer with copyright', () => {
    render(<Sidebar collapsed={false} onToggle={mockOnToggle} />);

    expect(screen.getByText('© 2024 CONSULT')).toBeInTheDocument();
  });

  it('applies hover states correctly', () => {
    mockUsePathname.mockReturnValue('/other'); // Set to non-matching path
    render(<Sidebar collapsed={false} onToggle={mockOnToggle} />);

    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).toHaveClass('hover:bg-blue-50', 'hover:text-blue-600');
  });

  it('renders all navigation icons', () => {
    const { container } = render(
      <Sidebar collapsed={false} onToggle={mockOnToggle} />
    );

    // Check that each navigation item has an icon (svg element)
    const navItems = container.querySelectorAll('nav a');
    expect(navItems).toHaveLength(6);

    navItems.forEach((item) => {
      const icon = item.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('w-5', 'h-5');
    });
  });

  it('formats badge number correctly', () => {
    render(<Sidebar collapsed={false} onToggle={mockOnToggle} />);

    // The badge should show "1,436" (formatted with comma)
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveTextContent('1,436');
  });

  it('applies correct responsive classes', () => {
    const { container } = render(
      <Sidebar collapsed={false} onToggle={mockOnToggle} />
    );

    const sidebar = container.querySelector('aside');
    expect(sidebar).toHaveClass('fixed', 'top-16', 'left-0', 'z-30');
    expect(sidebar).toHaveClass(
      'lg:static',
      'lg:top-0',
      'lg:h-screen',
      'lg:pt-16'
    );

    const closeButtonContainer = container.querySelector('.lg\\:hidden');
    expect(closeButtonContainer).toBeInTheDocument();
  });
});
