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
    expect(mainContent).toHaveClass(
      'flex-1',
      'transition-all',
      'duration-300',
      'pt-16',
      'min-h-screen'
    );
  });

  it('renders mobile overlay when sidebar is expanded', () => {
    const { container } = render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );

    // Should have overlay div for mobile
    const overlay = container.querySelector(
      '.fixed.inset-0.bg-black.bg-opacity-50'
    );
    expect(overlay).toBeInTheDocument();
  });
});
