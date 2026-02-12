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

  it('renders Free Plan badge', () => {
    render(<Header onMenuClick={mockOnMenuClick} sidebarCollapsed={false} />);

    const badge = screen.getByTestId('badge');
    expect(badge).toHaveTextContent('Free Plan');
    expect(badge).toHaveAttribute('data-variant', 'outline');
  });

  it('renders notification bell with count', () => {
    render(<Header onMenuClick={mockOnMenuClick} sidebarCollapsed={false} />);

    const bellButton = screen.getByLabelText(/Notifications/);
    expect(bellButton).toBeInTheDocument();

    // Check for notification count badge
    // Check for notification count in aria-label
    expect(bellButton).toHaveAttribute(
      'aria-label',
      expect.stringContaining('3 unread')
    );
    // Check for red dot indicator
    const redDot = bellButton.querySelector('.bg-red-500');
    expect(redDot).toBeInTheDocument();
  });

  it('renders user avatar and dropdown trigger', () => {
    render(<Header onMenuClick={mockOnMenuClick} sidebarCollapsed={false} />);

    const avatar = screen.getByTestId('avatar');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('data-size', 'sm');
    // With no user profile available, fallback should be 'U'
    expect(avatar).toHaveAttribute('data-fallback', 'U');
  });

  it('calls onMenuClick when mobile menu button is clicked', () => {
    render(<Header onMenuClick={mockOnMenuClick} sidebarCollapsed={false} />);

    const menuButton = screen.getByLabelText('Toggle navigation sidebar');
    fireEvent.click(menuButton);

    expect(mockOnMenuClick).toHaveBeenCalledTimes(1);
  });

  it('toggles user dropdown menu when clicked', () => {
    render(<Header onMenuClick={mockOnMenuClick} sidebarCollapsed={false} />);

    const userMenuButton = screen.getByLabelText('User account menu');

    // Initially, dropdown should not be visible
    expect(screen.queryByText('Profile Settings')).not.toBeInTheDocument();

    // Click to open dropdown
    fireEvent.click(userMenuButton);
    expect(screen.getByText('Profile Settings')).toBeInTheDocument();
    // Default display name/email when no user is set
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('unknown@domain')).toBeInTheDocument();

    // Click again to close dropdown
    fireEvent.click(userMenuButton);
    expect(screen.queryByText('Profile Settings')).not.toBeInTheDocument();
  });

  it('renders all dropdown menu items', () => {
    render(<Header onMenuClick={mockOnMenuClick} sidebarCollapsed={false} />);

    const userMenuButton = screen.getByLabelText('User account menu');
    fireEvent.click(userMenuButton);

    expect(screen.getByText('Profile Settings')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('applies correct responsive classes', () => {
    render(<Header onMenuClick={mockOnMenuClick} sidebarCollapsed={false} />);

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('fixed', 'top-0', 'left-0', 'right-0', 'z-30');

    // Check mobile menu button has lg:hidden class
    const menuButton = screen.getByLabelText('Toggle navigation sidebar');
    // lg:hidden is no longer applied as the button is used to toggle sidebar on desktop too
    expect(menuButton).toBeInTheDocument();
  });

  it('closes user menu when clicking outside', () => {
    const { container } = render(
      <Header onMenuClick={mockOnMenuClick} sidebarCollapsed={false} />
    );

    const userMenuButton = screen.getByLabelText('User account menu');
    fireEvent.click(userMenuButton);

    // Menu should be open
    expect(screen.getByText('Profile Settings')).toBeInTheDocument();

    // Click outside to close (simulate mousedown on document)
    fireEvent.mouseDown(document.body);

    // Menu should be closed
    expect(screen.queryByText('Profile Settings')).not.toBeInTheDocument();
  });
});
