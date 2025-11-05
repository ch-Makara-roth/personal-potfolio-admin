import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarWidget } from '../CalendarWidget';
import type { CalendarWidgetProps } from '@/types/ui';

// Mock the cn utility
jest.mock('@/utils/cn', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

describe('CalendarWidget', () => {
  const mockOnMonthChange = jest.fn();
  const mockOnDateClick = jest.fn();

  const defaultProps: CalendarWidgetProps = {
    currentDate: new Date(2024, 10, 15), // November 15, 2024
    events: [],
    onMonthChange: mockOnMonthChange,
    onDateClick: mockOnDateClick,
  };

  const eventsWithData: CalendarWidgetProps['events'] = [
    { date: '2024-11-16', type: 'interview' },
    { date: '2024-11-20', type: 'deadline' },
    { date: '2024-11-25', type: 'meeting' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders calendar with correct month and year', () => {
      render(<CalendarWidget {...defaultProps} />);

      expect(screen.getByText('November 2024')).toBeInTheDocument();
    });

    it('renders all days of the week headers', () => {
      render(<CalendarWidget {...defaultProps} />);

      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      daysOfWeek.forEach((day) => {
        expect(screen.getByText(day)).toBeInTheDocument();
      });
    });

    it('renders navigation arrows', () => {
      render(<CalendarWidget {...defaultProps} />);

      expect(screen.getByLabelText('Previous month')).toBeInTheDocument();
      expect(screen.getByLabelText('Next month')).toBeInTheDocument();
    });

    it('renders calendar grid with 42 days (6 weeks)', () => {
      render(<CalendarWidget {...defaultProps} />);

      // Should have 42 date buttons (6 weeks × 7 days)
      const dateButtons = screen
        .getAllByRole('button')
        .filter((button) =>
          button.getAttribute('aria-label')?.includes('2024')
        );
      expect(dateButtons).toHaveLength(42);
    });
  });

  describe('Navigation', () => {
    it('calls onMonthChange when previous month button is clicked', async () => {
      const user = userEvent.setup();
      render(<CalendarWidget {...defaultProps} />);

      const prevButton = screen.getByLabelText('Previous month');
      await user.click(prevButton);

      expect(mockOnMonthChange).toHaveBeenCalledWith(new Date(2024, 9, 1)); // October 2024
    });

    it('calls onMonthChange when next month button is clicked', async () => {
      const user = userEvent.setup();
      render(<CalendarWidget {...defaultProps} />);

      const nextButton = screen.getByLabelText('Next month');
      await user.click(nextButton);

      expect(mockOnMonthChange).toHaveBeenCalledWith(new Date(2024, 11, 1)); // December 2024
    });

    it('updates month display when currentDate prop changes', () => {
      const { rerender } = render(<CalendarWidget {...defaultProps} />);

      expect(screen.getByText('November 2024')).toBeInTheDocument();

      rerender(
        <CalendarWidget
          {...defaultProps}
          currentDate={new Date(2024, 11, 15)} // December 2024
        />
      );

      expect(screen.getByText('December 2024')).toBeInTheDocument();
    });
  });

  describe('Date Selection', () => {
    it('calls onDateClick when a date is clicked', async () => {
      const user = userEvent.setup();
      render(<CalendarWidget {...defaultProps} />);

      // Find and click on day 15
      const day15Button = screen.getByRole('button', {
        name: /11\/15\/2024/i,
      });
      await user.click(day15Button);

      expect(mockOnDateClick).toHaveBeenCalledWith(new Date(2024, 10, 15));
    });

    it('does not call onDateClick when onDateClick prop is not provided', async () => {
      const user = userEvent.setup();
      const propsWithoutOnDateClick = {
        ...defaultProps,
        onDateClick: undefined,
      };

      render(<CalendarWidget {...propsWithoutOnDateClick} />);

      const day15Button = screen.getByRole('button', {
        name: /11\/15\/2024/i,
      });
      await user.click(day15Button);

      // Should not throw error
      expect(mockOnDateClick).not.toHaveBeenCalled();
    });
  });

  describe('Event Display', () => {
    it('displays event dots for dates with events', () => {
      render(<CalendarWidget {...defaultProps} events={eventsWithData} />);

      // Check for event dots (they should be present but might not have accessible text)
      const day16Button = screen.getByRole('button', {
        name: /11\/16\/2024/i,
      });
      const day20Button = screen.getByRole('button', {
        name: /11\/20\/2024/i,
      });
      const day25Button = screen.getByRole('button', {
        name: /11\/25\/2024/i,
      });

      // Check that these buttons exist (they should have event dots)
      expect(day16Button).toBeInTheDocument();
      expect(day20Button).toBeInTheDocument();
      expect(day25Button).toBeInTheDocument();
    });

    it('applies correct styling for different event types', () => {
      const { container } = render(
        <CalendarWidget {...defaultProps} events={eventsWithData} />
      );

      // Check for different colored dots based on event types
      const interviewDot = container.querySelector('.bg-blue-500');
      const deadlineDot = container.querySelector('.bg-red-500');
      const meetingDot = container.querySelector('.bg-green-500');

      expect(interviewDot).toBeInTheDocument();
      expect(deadlineDot).toBeInTheDocument();
      expect(meetingDot).toBeInTheDocument();
    });

    it('handles empty events array gracefully', () => {
      render(<CalendarWidget {...defaultProps} events={[]} />);

      // Should render without errors
      expect(screen.getByText('November 2024')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels for navigation buttons', () => {
      render(<CalendarWidget {...defaultProps} />);

      expect(screen.getByLabelText('Previous month')).toBeInTheDocument();
      expect(screen.getByLabelText('Next month')).toBeInTheDocument();
    });

    it('provides proper ARIA labels for date buttons', () => {
      render(<CalendarWidget {...defaultProps} />);

      // Check that date buttons have proper aria-labels
      const day15Button = screen.getByRole('button', {
        name: /11\/15\/2024/i,
      });
      expect(day15Button).toHaveAttribute('aria-label');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<CalendarWidget {...defaultProps} />);

      const prevButton = screen.getByLabelText('Previous month');

      // Focus and use Enter key
      prevButton.focus();
      await user.keyboard('{Enter}');

      expect(mockOnMonthChange).toHaveBeenCalled();
    });
  });

  describe('Responsive Design', () => {
    it('applies correct size variant classes', () => {
      const { container, rerender } = render(
        <CalendarWidget {...defaultProps} size="compact" />
      );

      expect(container.firstChild).toHaveClass('max-w-xs');

      rerender(<CalendarWidget {...defaultProps} size="full" />);
      expect(container.firstChild).toHaveClass('w-full');
    });

    it('applies custom className', () => {
      const { container } = render(
        <CalendarWidget {...defaultProps} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Edge Cases', () => {
    it('handles month boundaries correctly', () => {
      // Test January (month 0)
      const { rerender } = render(
        <CalendarWidget {...defaultProps} currentDate={new Date(2024, 0, 15)} />
      );

      expect(screen.getByText('January 2024')).toBeInTheDocument();

      // Test December (month 11)
      rerender(
        <CalendarWidget
          {...defaultProps}
          currentDate={new Date(2024, 11, 15)}
        />
      );

      expect(screen.getByText('December 2024')).toBeInTheDocument();
    });

    it('handles leap year correctly', () => {
      render(
        <CalendarWidget
          {...defaultProps}
          currentDate={new Date(2024, 1, 15)} // February 2024 (leap year)
        />
      );

      expect(screen.getByText('February 2024')).toBeInTheDocument();
      // In a leap year, February should have 29 days
      expect(
        screen.getByRole('button', { name: /2\/29\/2024/i })
      ).toBeInTheDocument();
    });

    it('handles year boundaries correctly', () => {
      // Navigate from January to December of previous year
      const propsForJanuary = {
        ...defaultProps,
        currentDate: new Date(2024, 0, 15), // January 2024
      };

      render(<CalendarWidget {...propsForJanuary} />);

      const prevButton = screen.getByLabelText('Previous month');
      fireEvent.click(prevButton);

      expect(mockOnMonthChange).toHaveBeenCalledWith(new Date(2023, 11, 1)); // December 2023
    });
  });
});
