import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useInterviewManagement } from '../useInterviewManagement';

// Mock the API hooks
const mockInterviews = [
  {
    id: '1',
    candidate: {
      name: 'Sarah Johnson',
      avatar: 'https://example.com/sarah.jpg',
      role: 'Frontend Developer',
    },
    timeSlot: {
      start: '2024-11-16T10:00:00Z', // Tomorrow
      end: '2024-11-16T12:45:00Z',
    },
    status: 'scheduled' as const,
  },
  {
    id: '2',
    candidate: {
      name: 'Michael Chen',
      role: 'Backend Developer',
    },
    timeSlot: {
      start: '2024-11-15T14:00:00Z', // Today
      end: '2024-11-15T15:30:00Z',
    },
    status: 'scheduled' as const,
  },
  {
    id: '3',
    candidate: {
      name: 'Emily Rodriguez',
      role: 'UX Designer',
    },
    timeSlot: {
      start: '2024-11-17T09:00:00Z', // Day after tomorrow
      end: '2024-11-17T10:30:00Z',
    },
    status: 'scheduled' as const,
  },
];

jest.mock('../api/useInterviews', () => ({
  useUpcomingInterviews: jest.fn(() => ({
    data: {
      data: mockInterviews,
    },
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })),
  transformInterviewsForUI: jest.fn((interviews) =>
    interviews.map((interview: any) => ({
      id: interview.id,
      candidate: {
        name: interview.candidate.name,
        avatar: interview.candidate.avatar,
        role: interview.candidate.role,
      },
      timeSlot: {
        start: interview.timeSlot.start,
        end: interview.timeSlot.end,
      },
    }))
  ),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  TestWrapper.displayName = 'UseInterviewManagementTestWrapper';
  return TestWrapper;
};

describe('useInterviewManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-11-15T08:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    it('initializes with default options', () => {
      const { result } = renderHook(() => useInterviewManagement(), {
        wrapper: createWrapper(),
      });

      expect(result.current.selectedInterview).toBeNull();
      expect(result.current.expandedView).toBe(false);
      expect(result.current.interviews).toHaveLength(3);
    });

    it('initializes with custom maxVisible', () => {
      const { result } = renderHook(
        () => useInterviewManagement({ maxVisible: 2 }),
        { wrapper: createWrapper() }
      );

      expect(result.current.displayedInterviews).toHaveLength(2);
      expect(result.current.hasMoreInterviews).toBe(true);
    });

    it('initializes with custom options', () => {
      const { result } = renderHook(
        () =>
          useInterviewManagement({
            maxVisible: 1,
            autoRefresh: false,
            refreshInterval: 10000,
          }),
        { wrapper: createWrapper() }
      );

      expect(result.current.displayedInterviews).toHaveLength(1);
    });
  });

  describe('Interview selection', () => {
    it('selects an interview', () => {
      const { result } = renderHook(() => useInterviewManagement(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.selectInterview('1');
      });

      expect(result.current.selectedInterview).toBe('1');
      expect(result.current.isInterviewSelected('1')).toBe(true);
      expect(result.current.isInterviewSelected('2')).toBe(false);
    });

    it('clears selection', () => {
      const { result } = renderHook(() => useInterviewManagement(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.selectInterview('1');
      });

      expect(result.current.selectedInterview).toBe('1');

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedInterview).toBeNull();
    });

    it('gets interview by ID', () => {
      const { result } = renderHook(() => useInterviewManagement(), {
        wrapper: createWrapper(),
      });

      const interview = result.current.getInterviewById('1');
      expect(interview?.candidate.name).toBe('Sarah Johnson');

      const nonExistent = result.current.getInterviewById('999');
      expect(nonExistent).toBeUndefined();
    });
  });

  describe('View management', () => {
    it('toggles expanded view', () => {
      const { result } = renderHook(
        () => useInterviewManagement({ maxVisible: 2 }),
        { wrapper: createWrapper() }
      );

      expect(result.current.expandedView).toBe(false);
      expect(result.current.displayedInterviews).toHaveLength(2);

      act(() => {
        result.current.toggleExpandedView();
      });

      expect(result.current.expandedView).toBe(true);
      expect(result.current.displayedInterviews).toHaveLength(3);

      act(() => {
        result.current.toggleExpandedView();
      });

      expect(result.current.expandedView).toBe(false);
      expect(result.current.displayedInterviews).toHaveLength(2);
    });

    it('shows all interviews', () => {
      const { result } = renderHook(
        () => useInterviewManagement({ maxVisible: 1 }),
        { wrapper: createWrapper() }
      );

      expect(result.current.displayedInterviews).toHaveLength(1);

      act(() => {
        result.current.showAllInterviews();
      });

      expect(result.current.expandedView).toBe(true);
      expect(result.current.displayedInterviews).toHaveLength(3);
    });

    it('shows limited interviews', () => {
      const { result } = renderHook(
        () => useInterviewManagement({ maxVisible: 1 }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.showAllInterviews();
      });

      expect(result.current.displayedInterviews).toHaveLength(3);

      act(() => {
        result.current.showLimitedInterviews();
      });

      expect(result.current.expandedView).toBe(false);
      expect(result.current.displayedInterviews).toHaveLength(1);
    });
  });

  describe('Interview categorization', () => {
    it("categorizes today's interviews", () => {
      const { result } = renderHook(() => useInterviewManagement(), {
        wrapper: createWrapper(),
      });

      expect(result.current.todayInterviews).toHaveLength(1);
      expect(result.current.todayInterviews[0].candidate.name).toBe(
        'Michael Chen'
      );
    });

    it('categorizes upcoming interviews', () => {
      const { result } = renderHook(() => useInterviewManagement(), {
        wrapper: createWrapper(),
      });

      expect(result.current.upcomingInterviews).toHaveLength(2);
      expect(
        result.current.upcomingInterviews.map((i) => i.candidate.name)
      ).toEqual(['Sarah Johnson', 'Emily Rodriguez']);
    });

    it('identifies next interview', () => {
      const { result } = renderHook(() => useInterviewManagement(), {
        wrapper: createWrapper(),
      });

      expect(result.current.nextInterview?.candidate.name).toBe('Michael Chen');
    });
  });

  describe('Statistics', () => {
    it('calculates correct statistics', () => {
      const { result } = renderHook(() => useInterviewManagement(), {
        wrapper: createWrapper(),
      });

      expect(result.current.stats).toEqual({
        total: 3,
        today: 1,
        upcoming: 2,
        hasNext: true,
      });
    });

    it('handles empty interviews list', () => {
      // Mock empty interviews
      const useUpcomingInterviews =
        require('../api/useInterviews').useUpcomingInterviews;
      useUpcomingInterviews.mockReturnValueOnce({
        data: { data: [] },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      const { result } = renderHook(() => useInterviewManagement(), {
        wrapper: createWrapper(),
      });

      expect(result.current.stats).toEqual({
        total: 0,
        today: 0,
        upcoming: 0,
        hasNext: false,
      });
    });
  });

  describe('Keyboard navigation', () => {
    it('handles ArrowDown key navigation', () => {
      const { result } = renderHook(() => useInterviewManagement(), {
        wrapper: createWrapper(),
      });

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
        Object.defineProperty(event, 'preventDefault', {
          value: jest.fn(),
        });
        result.current.handleKeyDown(event);
      });

      expect(result.current.selectedInterview).toBe('1');

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
        Object.defineProperty(event, 'preventDefault', {
          value: jest.fn(),
        });
        result.current.handleKeyDown(event);
      });

      expect(result.current.selectedInterview).toBe('2');
    });

    it('handles ArrowUp key navigation', () => {
      const { result } = renderHook(() => useInterviewManagement(), {
        wrapper: createWrapper(),
      });

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
        Object.defineProperty(event, 'preventDefault', {
          value: jest.fn(),
        });
        result.current.handleKeyDown(event);
      });

      expect(result.current.selectedInterview).toBe('3'); // Last interview

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
        Object.defineProperty(event, 'preventDefault', {
          value: jest.fn(),
        });
        result.current.handleKeyDown(event);
      });

      expect(result.current.selectedInterview).toBe('2');
    });

    it('handles Escape key to clear selection', () => {
      const { result } = renderHook(() => useInterviewManagement(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.selectInterview('1');
      });

      expect(result.current.selectedInterview).toBe('1');

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'Escape' });
        Object.defineProperty(event, 'preventDefault', {
          value: jest.fn(),
        });
        result.current.handleKeyDown(event);
      });

      expect(result.current.selectedInterview).toBeNull();
    });

    it('handles Enter and Space keys on selected interview', () => {
      const { result } = renderHook(() => useInterviewManagement(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.selectInterview('1');
      });

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'Enter' });
        Object.defineProperty(event, 'preventDefault', {
          value: jest.fn(),
        });
        result.current.handleKeyDown(event);
      });

      // In a real implementation, this would trigger some action
      expect(result.current.selectedInterview).toBe('1');
    });

    it('ignores keyboard events when no interviews', () => {
      // Mock empty interviews
      const useUpcomingInterviews =
        require('../api/useInterviews').useUpcomingInterviews;
      useUpcomingInterviews.mockReturnValueOnce({
        data: { data: [] },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      const { result } = renderHook(() => useInterviewManagement(), {
        wrapper: createWrapper(),
      });

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
        result.current.handleKeyDown(event);
      });

      expect(result.current.selectedInterview).toBeNull();
    });
  });

  describe('Data loading states', () => {
    it('exposes loading state', () => {
      const { result } = renderHook(() => useInterviewManagement(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('exposes error state', () => {
      const { result } = renderHook(() => useInterviewManagement(), {
        wrapper: createWrapper(),
      });

      expect(result.current.error).toBeNull();
    });

    it('provides refetch function', () => {
      const { result } = renderHook(() => useInterviewManagement(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.refetch).toBe('function');
    });
  });

  describe('Edge cases', () => {
    it('handles circular navigation correctly', () => {
      const { result } = renderHook(() => useInterviewManagement(), {
        wrapper: createWrapper(),
      });

      // Navigate to last item
      act(() => {
        result.current.selectInterview('3');
      });

      // ArrowDown should wrap to first item
      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
        Object.defineProperty(event, 'preventDefault', {
          value: jest.fn(),
        });
        result.current.handleKeyDown(event);
      });

      expect(result.current.selectedInterview).toBe('1');
    });

    it('handles maxVisible of 0', () => {
      const { result } = renderHook(
        () => useInterviewManagement({ maxVisible: 0 }),
        { wrapper: createWrapper() }
      );

      expect(result.current.displayedInterviews).toHaveLength(0);
      expect(result.current.hasMoreInterviews).toBe(true);
    });

    it('handles maxVisible greater than available interviews', () => {
      const { result } = renderHook(
        () => useInterviewManagement({ maxVisible: 10 }),
        { wrapper: createWrapper() }
      );

      expect(result.current.displayedInterviews).toHaveLength(3);
      expect(result.current.hasMoreInterviews).toBe(false);
    });
  });
});
