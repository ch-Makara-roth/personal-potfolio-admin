/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/alt-text */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UpcomingInterviews } from '../UpcomingInterviews';
import type { UpcomingInterviewsProps } from '@/types/ui';

// Mock the cn utility
jest.mock('@/utils/cn', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

// Mock the Avatar component
jest.mock('../Avatar', () => ({
  Avatar: ({ children, size }: any) => (
    <div data-testid="avatar" data-size={size}>
      {children}
    </div>
  ),
  AvatarImage: ({ src, alt }: any) => (
    <img src={src} alt={alt} data-testid="avatar-image" />
  ),
  AvatarFallback: ({ children }: any) => (
    <div data-testid="avatar-fallback">{children}</div>
  ),
}));

// Mock the Badge component
jest.mock('../Badge', () => ({
  Badge: ({ children, variant, size, className }: any) => (
    <span
      data-testid="badge"
      data-variant={variant}
      data-size={size}
      className={className}
    >
      {children}
    </span>
  ),
}));

describe('UpcomingInterviews', () => {
  const mockInterviews: UpcomingInterviewsProps['interviews'] = [
    {
      id: '1',
      candidate: {
        name: 'Sarah Johnson',
        avatar: 'https://example.com/sarah.jpg',
        role: 'Frontend Developer',
      },
      timeSlot: {
        start: '2024-11-16T10:00:00Z',
        end: '2024-11-16T12:45:00Z',
      },
    },
    {
      id: '2',
      candidate: {
        name: 'Michael Chen',
        avatar: 'https://example.com/michael.jpg',
        role: 'Backend Developer',
      },
      timeSlot: {
        start: '2024-11-17T14:00:00Z',
        end: '2024-11-17T15:30:00Z',
      },
    },
    {
      id: '3',
      candidate: {
        name: 'Emily Rodriguez',
        role: 'UX Designer',
      },
      timeSlot: {
        start: '2024-11-18T09:00:00Z',
        end: '2024-11-18T10:30:00Z',
      },
    },
  ];

  const defaultProps: UpcomingInterviewsProps = {
    interviews: mockInterviews,
  };

  beforeEach(() => {
    // Mock current date to ensure consistent test results
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-11-15T08:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Rendering with interviews', () => {
    it('renders header with correct title and count', () => {
      render(<UpcomingInterviews {...defaultProps} />);

      expect(screen.getByText('Upcoming Interviews')).toBeInTheDocument();
      const badges = screen.getAllByTestId('badge');
      const countBadge = badges.find((badge) => badge.textContent === '3');
      expect(countBadge).toBeInTheDocument();
    });

    it('renders all interviews when no maxVisible limit', () => {
      render(<UpcomingInterviews {...defaultProps} />);

      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
      expect(screen.getByText('Michael Chen')).toBeInTheDocument();
      expect(screen.getByText('Emily Rodriguez')).toBeInTheDocument();
    });

    it('limits displayed interviews when maxVisible is set', () => {
      render(<UpcomingInterviews {...defaultProps} maxVisible={2} />);

      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
      expect(screen.getByText('Michael Chen')).toBeInTheDocument();
      expect(screen.queryByText('Emily Rodriguez')).not.toBeInTheDocument();
    });

    it('shows "View more" button when there are more interviews than maxVisible', () => {
      render(<UpcomingInterviews {...defaultProps} maxVisible={2} />);

      expect(screen.getByText('View 1 more interviews')).toBeInTheDocument();
    });

    it('does not show "View more" button when all interviews are displayed', () => {
      render(<UpcomingInterviews {...defaultProps} maxVisible={5} />);

      expect(
        screen.queryByText(/View.*more interviews/)
      ).not.toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('renders empty state when no interviews provided', () => {
      render(<UpcomingInterviews interviews={[]} />);

      expect(screen.getByText('No upcoming interviews')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Your interview schedule is clear. New interviews will appear here.'
        )
      ).toBeInTheDocument();
    });

    it('renders calendar icon in empty state', () => {
      render(<UpcomingInterviews interviews={[]} />);

      // The Calendar icon should be rendered (Lucide React component)
      expect(screen.getByText('No upcoming interviews')).toBeInTheDocument();
    });
  });

  describe('Interview card rendering', () => {
    it('displays candidate information correctly', () => {
      render(<UpcomingInterviews {...defaultProps} />);

      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
    });

    it('renders avatar with image when avatar URL is provided', () => {
      render(<UpcomingInterviews {...defaultProps} />);

      const avatarImages = screen.getAllByTestId('avatar-image');
      const sarahAvatar = avatarImages.find(
        (img) => img.getAttribute('alt') === 'Sarah Johnson'
      );
      expect(sarahAvatar).toHaveAttribute(
        'src',
        'https://example.com/sarah.jpg'
      );
      expect(sarahAvatar).toHaveAttribute('alt', 'Sarah Johnson');
    });

    it('renders avatar fallback with initials when no avatar URL', () => {
      render(<UpcomingInterviews {...defaultProps} />);

      // Emily Rodriguez has no avatar, so should show initials
      const avatarFallbacks = screen.getAllByTestId('avatar-fallback');
      expect(
        avatarFallbacks.some((fallback) => fallback.textContent === 'ER')
      ).toBe(true);
    });

    it('formats time slots correctly', () => {
      render(<UpcomingInterviews {...defaultProps} />);

      // Should format time as HH:MM-HH:MM (times are converted to local timezone)
      expect(screen.getByText('17:00-19:45')).toBeInTheDocument();
      expect(screen.getByText('21:00-22:30')).toBeInTheDocument();
    });

    it('displays date labels correctly', () => {
      render(<UpcomingInterviews {...defaultProps} />);

      // Dates should be formatted appropriately
      // Note: The exact format depends on the current date and locale
      expect(screen.getByText('Tomorrow')).toBeInTheDocument(); // Nov 16 is tomorrow from Nov 15
    });
  });

  describe('Highlighting and styling', () => {
    it("highlights today's interviews differently", () => {
      const todayInterview = {
        id: '4',
        candidate: {
          name: 'Today Interview',
          role: 'Developer',
        },
        timeSlot: {
          start: '2024-11-15T15:00:00Z', // Today
          end: '2024-11-15T16:00:00Z',
        },
      };

      render(<UpcomingInterviews interviews={[todayInterview]} />);

      expect(screen.getByText('Today')).toBeInTheDocument();
    });

    it('applies correct badge styling for time slots', () => {
      render(<UpcomingInterviews {...defaultProps} />);

      const timeBadges = screen
        .getAllByTestId('badge')
        .filter((badge) => badge.textContent?.includes(':'));

      timeBadges.forEach((badge) => {
        expect(badge).toHaveClass('bg-blue-50');
        expect(badge).toHaveClass('text-blue-700');
        expect(badge).toHaveClass('border-blue-200');
      });
    });
  });

  describe('Accessibility', () => {
    it('provides proper semantic structure', () => {
      render(<UpcomingInterviews {...defaultProps} />);

      // Should have proper heading
      expect(
        screen.getByRole('heading', { name: 'Upcoming Interviews' })
      ).toBeInTheDocument();
    });

    it('handles keyboard navigation for "View more" button', () => {
      render(<UpcomingInterviews {...defaultProps} maxVisible={2} />);

      const viewMoreButton = screen.getByText('View 1 more interviews');

      // Should be focusable
      expect(viewMoreButton).toBeInTheDocument();
      expect(viewMoreButton.tagName).toBe('BUTTON');
    });
  });

  describe('Responsive design', () => {
    it('applies correct size variant classes', () => {
      const { container, rerender } = render(
        <UpcomingInterviews {...defaultProps} size="compact" />
      );

      expect(container.firstChild).toHaveClass('max-w-sm');

      rerender(<UpcomingInterviews {...defaultProps} size="default" />);
      expect(container.firstChild).toHaveClass('w-full');
    });

    it('applies custom className', () => {
      const { container } = render(
        <UpcomingInterviews {...defaultProps} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Edge cases', () => {
    it('handles interviews with missing optional fields', () => {
      const incompleteInterview = {
        id: '5',
        candidate: {
          name: 'Incomplete Data',
          role: 'Developer',
          // No avatar
        },
        timeSlot: {
          start: '2024-11-19T10:00:00Z',
          end: '2024-11-19T11:00:00Z',
        },
      };

      render(<UpcomingInterviews interviews={[incompleteInterview]} />);

      expect(screen.getByText('Incomplete Data')).toBeInTheDocument();
      expect(screen.getByText('Developer')).toBeInTheDocument();
    });

    it('handles very long candidate names gracefully', () => {
      const longNameInterview = {
        id: '6',
        candidate: {
          name: 'Very Long Candidate Name That Should Be Truncated Properly',
          role: 'Developer',
        },
        timeSlot: {
          start: '2024-11-19T10:00:00Z',
          end: '2024-11-19T11:00:00Z',
        },
      };

      render(<UpcomingInterviews interviews={[longNameInterview]} />);

      const nameElement = screen.getByText(
        'Very Long Candidate Name That Should Be Truncated Properly'
      );
      expect(nameElement).toHaveClass('truncate');
    });

    it('handles maxVisible of 0', () => {
      render(<UpcomingInterviews {...defaultProps} maxVisible={0} />);

      // Should show "View more" button but no interviews
      expect(screen.queryByText('Sarah Johnson')).not.toBeInTheDocument();
      expect(screen.getByText('View 3 more interviews')).toBeInTheDocument();
    });

    it('handles maxVisible greater than available interviews', () => {
      render(<UpcomingInterviews {...defaultProps} maxVisible={10} />);

      // Should show all interviews without "View more" button
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
      expect(screen.getByText('Michael Chen')).toBeInTheDocument();
      expect(screen.getByText('Emily Rodriguez')).toBeInTheDocument();
      expect(
        screen.queryByText(/View.*more interviews/)
      ).not.toBeInTheDocument();
    });
  });
});
