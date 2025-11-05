import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HiringSourcesChart } from '../HiringSourcesChart';
import type { HiringSource } from '@/types/api';

// Mock data for testing
const mockHiringSourcesData: HiringSource[] = [
  {
    id: '1',
    source: 'Direct',
    value: 85,
    category: 'design',
  },
  {
    id: '2',
    source: 'Dribbble',
    value: 65,
    category: 'design',
  },
  {
    id: '3',
    source: 'LinkedIn',
    value: 45,
    category: 'engineering',
  },
  {
    id: '4',
    source: 'GitHub',
    value: 72,
    category: 'engineering',
  },
  {
    id: '5',
    source: 'Twitter',
    value: 38,
    category: 'marketing',
  },
  {
    id: '6',
    source: 'Referrals',
    value: 92,
    category: 'marketing',
  },
];

describe('HiringSourcesChart', () => {
  it('renders with default props', () => {
    render(<HiringSourcesChart data={mockHiringSourcesData} />);

    expect(screen.getByText('Top Hiring Sources')).toBeInTheDocument();
    expect(screen.getByText('Scale: 0-100')).toBeInTheDocument();
  });

  it('renders custom title and max value', () => {
    render(
      <HiringSourcesChart
        data={mockHiringSourcesData}
        title="Custom Chart Title"
        maxValue={200}
      />
    );

    expect(screen.getByText('Custom Chart Title')).toBeInTheDocument();
    expect(screen.getByText('Scale: 0-200')).toBeInTheDocument();
  });

  it('displays all hiring sources with correct values', () => {
    render(<HiringSourcesChart data={mockHiringSourcesData} />);

    // Check that all sources are displayed
    expect(screen.getByText('Direct')).toBeInTheDocument();
    expect(screen.getByText('Dribbble')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('Twitter')).toBeInTheDocument();
    expect(screen.getByText('Referrals')).toBeInTheDocument();

    // Check that values are displayed
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('65')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('72')).toBeInTheDocument();
    expect(screen.getByText('38')).toBeInTheDocument();
    expect(screen.getByText('92')).toBeInTheDocument();
  });

  it('displays category labels for each source', () => {
    render(<HiringSourcesChart data={mockHiringSourcesData} />);

    // Check category labels are displayed
    expect(screen.getAllByText('(design)')).toHaveLength(2);
    expect(screen.getAllByText('(engineering)')).toHaveLength(2);
    expect(screen.getAllByText('(marketing)')).toHaveLength(2);
  });

  it('sorts data by value in descending order', () => {
    render(<HiringSourcesChart data={mockHiringSourcesData} />);

    const sourceElements = screen.getAllByText(
      /Direct|Dribbble|LinkedIn|GitHub|Twitter|Referrals/
    );
    const sourceNames = sourceElements.map((el) => el.textContent);

    // Should be sorted by value: Referrals (92), Direct (85), GitHub (72), Dribbble (65), LinkedIn (45), Twitter (38)
    expect(sourceNames[0]).toBe('Referrals');
    expect(sourceNames[1]).toBe('Direct');
    expect(sourceNames[2]).toBe('GitHub');
  });

  it('renders legend with all categories', () => {
    render(
      <HiringSourcesChart data={mockHiringSourcesData} showLegend={true} />
    );

    expect(screen.getByText('Design')).toBeInTheDocument();
    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText('Marketing')).toBeInTheDocument();
  });

  it('hides legend when showLegend is false', () => {
    render(
      <HiringSourcesChart data={mockHiringSourcesData} showLegend={false} />
    );

    expect(screen.queryByText('Design')).not.toBeInTheDocument();
    expect(screen.queryByText('Engineering')).not.toBeInTheDocument();
    expect(screen.queryByText('Marketing')).not.toBeInTheDocument();
  });

  it('shows category counts in legend', () => {
    render(<HiringSourcesChart data={mockHiringSourcesData} />);

    // Each category should show count of 2 (2 sources per category in mock data)
    const countBadges = screen.getAllByText('2');
    expect(countBadges).toHaveLength(3); // One for each category
  });

  it('filters data when legend categories are toggled', async () => {
    render(<HiringSourcesChart data={mockHiringSourcesData} />);

    // Initially all sources should be visible
    expect(screen.getByText('Direct')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
    expect(screen.getByText('Twitter')).toBeInTheDocument();

    // Click on Design category to toggle it off
    const designButton = screen.getByRole('button', { name: /Design/ });
    fireEvent.click(designButton);

    await waitFor(() => {
      // Design sources should be hidden
      expect(screen.queryByText('Direct')).not.toBeInTheDocument();
      expect(screen.queryByText('Dribbble')).not.toBeInTheDocument();

      // Other categories should still be visible
      expect(screen.getByText('LinkedIn')).toBeInTheDocument();
      expect(screen.getByText('Twitter')).toBeInTheDocument();
    });
  });

  it('shows empty state when no data matches active categories', async () => {
    render(<HiringSourcesChart data={mockHiringSourcesData} />);

    // Toggle off all categories
    const designButton = screen.getByRole('button', { name: /Design/ });
    const engineeringButton = screen.getByRole('button', {
      name: /Engineering/,
    });
    const marketingButton = screen.getByRole('button', { name: /Marketing/ });

    fireEvent.click(designButton);
    fireEvent.click(engineeringButton);
    fireEvent.click(marketingButton);

    await waitFor(() => {
      expect(
        screen.getByText('No data available for selected categories')
      ).toBeInTheDocument();
    });
  });

  it('handles empty data array', () => {
    render(<HiringSourcesChart data={[]} />);

    expect(
      screen.getByText('No data available for selected categories')
    ).toBeInTheDocument();
  });

  it('applies correct bar widths based on values', () => {
    render(<HiringSourcesChart data={mockHiringSourcesData} maxValue={100} />);

    // Get all progress bars
    const progressBars = document.querySelectorAll('[style*="width"]');

    // Should have bars with different widths based on values
    expect(progressBars.length).toBeGreaterThan(0);

    // Check that the highest value (92) has the widest bar
    const referralsBar = progressBars[0] as HTMLElement; // First bar should be Referrals (highest value)
    expect(referralsBar.style.width).toBe('92%');
  });

  it('shows scale markers correctly', () => {
    render(<HiringSourcesChart data={mockHiringSourcesData} maxValue={100} />);

    // Check scale markers
    expect(screen.getAllByText('0')).toHaveLength(6); // One for each bar
    expect(screen.getAllByText('25')).toHaveLength(6);
    expect(screen.getAllByText('50')).toHaveLength(6);
    expect(screen.getAllByText('75')).toHaveLength(6);
    expect(screen.getAllByText('100')).toHaveLength(6);
  });

  it('handles custom max value for scale markers', () => {
    render(<HiringSourcesChart data={mockHiringSourcesData} maxValue={200} />);

    // Check custom scale markers
    expect(screen.getAllByText('0')).toHaveLength(6);
    expect(screen.getAllByText('50')).toHaveLength(6);
    expect(screen.getAllByText('100')).toHaveLength(6);
    expect(screen.getAllByText('150')).toHaveLength(6);
    expect(screen.getAllByText('200')).toHaveLength(6);
  });

  it('applies hover effects to chart bars', () => {
    render(<HiringSourcesChart data={mockHiringSourcesData} />);

    // Get the first chart bar group
    const chartBars = document.querySelectorAll('.group');
    expect(chartBars.length).toBeGreaterThan(0);

    // Each bar should have the group class for hover effects
    chartBars.forEach((bar) => {
      expect(bar).toHaveClass('group');
    });
  });

  it('legend buttons have proper accessibility attributes', () => {
    render(<HiringSourcesChart data={mockHiringSourcesData} />);

    const legendButtons = screen.getAllByRole('button');

    legendButtons.forEach((button) => {
      expect(button).toHaveClass('focus:outline-none');
      expect(button).toHaveClass('focus:ring-2');
    });
  });

  it('maintains category state correctly when toggling multiple times', async () => {
    render(<HiringSourcesChart data={mockHiringSourcesData} />);

    const designButton = screen.getByRole('button', { name: /Design/ });

    // Toggle design off
    fireEvent.click(designButton);

    await waitFor(() => {
      expect(screen.queryByText('Direct')).not.toBeInTheDocument();
    });

    // Toggle design back on
    fireEvent.click(designButton);

    await waitFor(() => {
      expect(screen.getByText('Direct')).toBeInTheDocument();
    });
  });

  it('renders with different size variants', () => {
    const { rerender } = render(
      <HiringSourcesChart data={mockHiringSourcesData} size="sm" />
    );

    let container = document.querySelector('.p-4');
    expect(container).toBeInTheDocument();

    rerender(<HiringSourcesChart data={mockHiringSourcesData} size="lg" />);

    container = document.querySelector('.p-8');
    expect(container).toBeInTheDocument();
  });
});
