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

    // Updated to match current navigation groups
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Blog Posts')).toBeInTheDocument();
    expect(screen.getByText('Comments')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByText('Contact Stats')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('does not render badges when none are provided', () => {
    render(<Sidebar collapsed={false} onToggle={mockOnToggle} />);
    expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
  });

  it('highlights active navigation item', () => {
    mockUsePathname.mockReturnValue('/projects');
    render(<Sidebar collapsed={false} onToggle={mockOnToggle} />);

    const projectsLink = screen.getByText('Projects').closest('a');
    expect(projectsLink).toHaveClass('bg-purple-50', 'text-purple-700');
  });

  it('applies correct classes when collapsed', () => {
    const { container } = render(
      <Sidebar collapsed={true} onToggle={mockOnToggle} />
    );

    const sidebar = container.querySelector('aside');
    expect(sidebar).toHaveClass(
      '-translate-x-full',
      'lg:translate-x-0',
      'lg:w-20'
    );
  });

  it('applies correct classes when expanded', () => {
    const { container } = render(
      <Sidebar collapsed={false} onToggle={mockOnToggle} />
    );

    const sidebar = container.querySelector('aside');
    expect(sidebar).toHaveClass('translate-x-0', 'w-72');
  });

  it('calls onToggle when close button is clicked', () => {
    render(<Sidebar collapsed={false} onToggle={mockOnToggle} />);

    const closeButton = screen.getByLabelText('Close navigation sidebar');
    fireEvent.click(closeButton);

    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it('renders mobile close button and navigation header', () => {
    render(<Sidebar collapsed={false} onToggle={mockOnToggle} />);

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Close navigation sidebar')
    ).toBeInTheDocument();
  });

  it('renders footer with copyright', () => {
    render(<Sidebar collapsed={false} onToggle={mockOnToggle} />);

    expect(screen.getByText('© 2024 CONSULT')).toBeInTheDocument();
  });

  it('applies hover states correctly', () => {
    mockUsePathname.mockReturnValue('/other'); // Set to non-matching path
    render(<Sidebar collapsed={false} onToggle={mockOnToggle} />);

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveClass(
      'hover:bg-gray-50',
      'hover:text-gray-900'
    );
  });

  it('renders all navigation icons', () => {
    const { container } = render(
      <Sidebar collapsed={false} onToggle={mockOnToggle} />
    );

    // Check that each navigation item has an icon (svg element)
    const navItems = container.querySelectorAll('nav a');
    expect(navItems).toHaveLength(8);

    navItems.forEach((item) => {
      const icon = item.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('w-5', 'h-5');
    });
  });

  it('renders sr-only description for items with description', () => {
    render(<Sidebar collapsed={false} onToggle={mockOnToggle} />);

    expect(screen.getByText('Dashboard and overview')).toBeInTheDocument();
  });

  it('applies correct responsive classes', () => {
    const { container } = render(
      <Sidebar collapsed={false} onToggle={mockOnToggle} />
    );

    const sidebar = container.querySelector('aside');
    expect(sidebar).toHaveClass('fixed', 'top-0', 'left-0', 'z-40');
    // Sidebar is now fixed on all screens
    expect(sidebar).toHaveClass('h-screen');

    const closeButtonContainer = container.querySelector('.lg\\:hidden');
    expect(closeButtonContainer).toBeInTheDocument();
  });
});
