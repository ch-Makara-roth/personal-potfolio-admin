import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../Header';

// Mock the UI components
jest.mock('../../ui/Badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  ),
}));

jest.mock('../../ui/Avatar', () => ({
  Avatar: ({ src, alt, fallback, size }: any) => (
    <div data-testid="avatar" data-size={size} data-fallback={fallback}>
      {alt}
    </div>
  ),
}));

describe('Header', () => {
  const mockOnMenuClick = jest.fn();

  beforeEach(() => {
    mockOnMenuClick.mockClear();
  });

  it('renders logo and CONSULT title', () => {
    render(<Header onMenuClick={mockOnMenuClick} />);

    expect(screen.getByText('CONSULT')).toBeInTheDocument();

    // Check for logo elements
    const logoContainer = screen.getByText('CONSULT').previousElementSibling;
    expect(logoContainer).toHaveClass(
      'w-8',
      'h-8',
      'bg-gradient-to-br',
      'from-blue-500',
      'to-blue-600'
    );
  });

  it('renders Free Plan badge', () => {
    render(<Header onMenuClick={mockOnMenuClick} />);

    const badge = screen.getByTestId('badge');
    expect(badge).toHaveTextContent('Free Plan');
    expect(badge).toHaveAttribute('data-variant', 'secondary');
  });

  it('renders notification bell with count', () => {
    render(<Header onMenuClick={mockOnMenuClick} />);

    const bellButton = screen.getByLabelText('Notifications');
    expect(bellButton).toBeInTheDocument();

    // Check for notification count badge
    const notificationBadge = screen.getByText('3');
    expect(notificationBadge).toBeInTheDocument();
    expect(notificationBadge).toHaveClass('bg-purple-600', 'text-white');
  });

  it('renders user avatar and dropdown trigger', () => {
    render(<Header onMenuClick={mockOnMenuClick} />);

    const avatar = screen.getByTestId('avatar');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('data-size', 'sm');
    expect(avatar).toHaveAttribute('data-fallback', 'JD');
  });

  it('calls onMenuClick when mobile menu button is clicked', () => {
    render(<Header onMenuClick={mockOnMenuClick} />);

    const menuButton = screen.getByLabelText('Toggle sidebar');
    fireEvent.click(menuButton);

    expect(mockOnMenuClick).toHaveBeenCalledTimes(1);
  });

  it('toggles user dropdown menu when clicked', () => {
    render(<Header onMenuClick={mockOnMenuClick} />);

    const userMenuButton = screen.getByLabelText('User menu');

    // Initially, dropdown should not be visible
    expect(screen.queryByText('Profile Settings')).not.toBeInTheDocument();

    // Click to open dropdown
    fireEvent.click(userMenuButton);
    expect(screen.getByText('Profile Settings')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();

    // Click again to close dropdown
    fireEvent.click(userMenuButton);
    expect(screen.queryByText('Profile Settings')).not.toBeInTheDocument();
  });

  it('renders all dropdown menu items', () => {
    render(<Header onMenuClick={mockOnMenuClick} />);

    const userMenuButton = screen.getByLabelText('User menu');
    fireEvent.click(userMenuButton);

    expect(screen.getByText('Profile Settings')).toBeInTheDocument();
    expect(screen.getByText('Account Settings')).toBeInTheDocument();
    expect(screen.getByText('Billing')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('applies correct responsive classes', () => {
    render(<Header onMenuClick={mockOnMenuClick} />);

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('fixed', 'top-0', 'left-0', 'right-0', 'z-30');

    // Check mobile menu button has lg:hidden class
    const menuButton = screen.getByLabelText('Toggle sidebar');
    expect(menuButton).toHaveClass('lg:hidden');

    // Check CONSULT title has hidden sm:block classes
    const title = screen.getByText('CONSULT');
    expect(title).toHaveClass('hidden', 'sm:block');
  });

  it('closes user menu when clicking outside', () => {
    const { container } = render(<Header onMenuClick={mockOnMenuClick} />);

    const userMenuButton = screen.getByLabelText('User menu');
    fireEvent.click(userMenuButton);

    // Menu should be open
    expect(screen.getByText('Profile Settings')).toBeInTheDocument();

    // Click on the overlay
    const overlay = container.querySelector('.fixed.inset-0.z-30');
    expect(overlay).toBeInTheDocument();
    fireEvent.click(overlay!);

    // Menu should be closed
    expect(screen.queryByText('Profile Settings')).not.toBeInTheDocument();
  });
});
