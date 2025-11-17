import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppLayout } from '../AppLayout';

// Mock the child components
jest.mock('../Header', () => ({
  Header: ({ onMenuClick }: { onMenuClick: () => void }) => (
    <div data-testid="header">
      <button onClick={onMenuClick} data-testid="menu-button">
        Menu
      </button>
    </div>
  ),
}));

jest.mock('../Sidebar', () => ({
  Sidebar: ({
    collapsed,
    onToggle,
  }: {
    collapsed: boolean;
    onToggle: () => void;
  }) => (
    <div data-testid="sidebar" data-collapsed={collapsed}>
      <button onClick={onToggle} data-testid="sidebar-toggle">
        Toggle
      </button>
    </div>
  ),
}));

describe('AppLayout', () => {
  it('renders header, sidebar, and main content', () => {
    render(
      <AppLayout>
        <div data-testid="main-content">Test Content</div>
      </AppLayout>
    );

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('main-content')).toBeInTheDocument();
  });

  it('starts with sidebar expanded by default', () => {
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );

    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar).toHaveAttribute('data-collapsed', 'false');
  });

  it('can start with sidebar collapsed when prop is provided', () => {
    render(
      <AppLayout sidebarCollapsed={true}>
        <div>Test Content</div>
      </AppLayout>
    );

    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar).toHaveAttribute('data-collapsed', 'true');
  });

  it('toggles sidebar when menu button is clicked', () => {
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );

    const menuButton = screen.getByTestId('menu-button');
    const sidebar = screen.getByTestId('sidebar');

    // Initially expanded
    expect(sidebar).toHaveAttribute('data-collapsed', 'false');

    // Click to collapse
    fireEvent.click(menuButton);
    expect(sidebar).toHaveAttribute('data-collapsed', 'true');

    // Click to expand
    fireEvent.click(menuButton);
    expect(sidebar).toHaveAttribute('data-collapsed', 'false');
  });

  it('toggles sidebar when sidebar toggle button is clicked', () => {
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );

    const sidebarToggle = screen.getByTestId('sidebar-toggle');
    const sidebar = screen.getByTestId('sidebar');

    // Initially expanded
    expect(sidebar).toHaveAttribute('data-collapsed', 'false');

    // Click to collapse
    fireEvent.click(sidebarToggle);
    expect(sidebar).toHaveAttribute('data-collapsed', 'true');
  });

  it('applies correct CSS classes for responsive behavior', () => {
    const { container } = render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );

    const mainContent = container.querySelector('main');
    expect(mainContent).toHaveClass('flex-1');
    expect(mainContent).toHaveClass('transition-all');
    expect(mainContent).toHaveClass('duration-300');
    expect(mainContent).toHaveClass('ease-in-out');
    expect(mainContent).toHaveClass('pt-18');
  });

  it('renders mobile overlay when sidebar is expanded', () => {
    // Simulate mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 400,
    });
    // Trigger resize so useBreakpoint updates
    fireEvent(window, new Event('resize'));

    const { container } = render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );

    // Sidebar auto-collapses on mobile; expand it to show overlay
    const menuButton = screen.getByTestId('menu-button');
    fireEvent.click(menuButton);

    // Should have overlay div for mobile
    const overlay = screen.getByRole('presentation');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass('fixed');
    expect(overlay).toHaveClass('inset-0');
    expect(overlay).toHaveClass('bg-black');
    expect(overlay).toHaveClass('bg-opacity-50');
  });
});
