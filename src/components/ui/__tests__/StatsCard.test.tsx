import React from 'react';
import { render, screen } from '@testing-library/react';
import { FileText, Circle, Check } from 'lucide-react';
import { StatsCard } from '../StatsCard';

describe('StatsCard', () => {
  const defaultProps = {
    title: 'Applications',
    value: 1234,
    icon: FileText,
  };

  it('renders basic stats card correctly', () => {
    render(<StatsCard {...defaultProps} />);

    expect(screen.getByText('Applications')).toBeInTheDocument();
    expect(screen.getByText('1234')).toBeInTheDocument();
  });

  it('renders with subtitle when provided', () => {
    render(<StatsCard {...defaultProps} subtitle="This month" />);

    expect(screen.getByText('This month')).toBeInTheDocument();
  });

  it('formats value using custom formatter', () => {
    const formatValue = (value: number | string) => `${value} total`;

    render(<StatsCard {...defaultProps} formatValue={formatValue} />);

    expect(screen.getByText('1234 total')).toBeInTheDocument();
  });

  it('renders different variants correctly', () => {
    const { rerender, container } = render(
      <StatsCard {...defaultProps} variant="applications" />
    );

    let cardElement = container.firstChild as HTMLElement;
    expect(cardElement).toHaveClass('border-purple-200');

    rerender(<StatsCard {...defaultProps} variant="interviews" />);
    cardElement = container.firstChild as HTMLElement;
    expect(cardElement).toHaveClass('border-blue-200');

    rerender(<StatsCard {...defaultProps} variant="hired" />);
    cardElement = container.firstChild as HTMLElement;
    expect(cardElement).toHaveClass('border-cyan-200');
  });

  it('renders trend line when trend data is provided', () => {
    const trendData = {
      data: [10, 15, 12, 18, 22, 20, 25],
    };

    render(<StatsCard {...defaultProps} trend={trendData} />);

    expect(screen.getByText('Trend')).toBeInTheDocument();
    // Check if SVG is rendered
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('does not render trend line when no trend data provided', () => {
    render(<StatsCard {...defaultProps} />);

    expect(screen.queryByText('Trend')).not.toBeInTheDocument();
    // Check that there's only one SVG (the icon) and no trend line SVG
    const svgs = document.querySelectorAll('svg');
    expect(svgs).toHaveLength(1); // Only the icon SVG
  });

  it('does not render trend line when trend data is empty', () => {
    const trendData = {
      data: [],
    };

    render(<StatsCard {...defaultProps} trend={trendData} />);

    expect(screen.queryByText('Trend')).not.toBeInTheDocument();
  });

  it('renders different icons correctly', () => {
    const { rerender } = render(
      <StatsCard {...defaultProps} icon={FileText} />
    );

    // FileText icon should be rendered
    expect(document.querySelector('svg')).toBeInTheDocument();

    rerender(<StatsCard {...defaultProps} icon={Circle} />);
    expect(document.querySelector('svg')).toBeInTheDocument();

    rerender(<StatsCard {...defaultProps} icon={Check} />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('applies custom className correctly', () => {
    const { container } = render(
      <StatsCard {...defaultProps} className="custom-class" />
    );

    const cardElement = container.firstChild as HTMLElement;
    expect(cardElement).toHaveClass('custom-class');
  });

  it('handles different sizes correctly', () => {
    const { rerender, container } = render(
      <StatsCard {...defaultProps} size="sm" />
    );

    let cardElement = container.firstChild as HTMLElement;
    expect(cardElement).toHaveClass('p-4');

    rerender(<StatsCard {...defaultProps} size="md" />);
    cardElement = container.firstChild as HTMLElement;
    expect(cardElement).toHaveClass('p-6');

    rerender(<StatsCard {...defaultProps} size="lg" />);
    cardElement = container.firstChild as HTMLElement;
    expect(cardElement).toHaveClass('p-8');
  });

  it('shows trend direction indicator correctly', () => {
    const upwardTrend = {
      data: [10, 15, 20, 25],
    };

    const { rerender } = render(
      <StatsCard {...defaultProps} trend={upwardTrend} />
    );

    expect(screen.getByText('↗')).toBeInTheDocument();

    const downwardTrend = {
      data: [25, 20, 15, 10],
    };

    rerender(<StatsCard {...defaultProps} trend={downwardTrend} />);

    expect(screen.getByText('↘')).toBeInTheDocument();
  });
});
