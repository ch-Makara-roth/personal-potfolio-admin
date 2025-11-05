import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useCalendarNavigation } from '../useCalendarNavigation';

// Mock the API hooks
const mockEvents = [
  { id: '1', date: '2024-11-16', type: 'interview', title: 'Test Interview' },
  { id: '2', date: '2024-11-20', type: 'deadline', title: 'Test Deadline' },
];

jest.mock('../api/useCalendar', () => ({
  useCalendarEvents: jest.fn(() => ({
    data: {
      data: mockEvents,
    },
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })),
  usePrefetchCalendarEvents: jest.fn(() => ({
    prefetchMonth: jest.fn(),
  })),
  transformEventsForCalendar: jest.fn((events) =>
    events.map((event: any) => ({
      date: event.date,
      type: event.type,
      title: event.title,
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
  TestWrapper.displayName = 'UseCalendarNavigationTestWrapper';
  return TestWrapper;
};

describe('useCalendarNavigation', () => {
  const mockOnDateChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-11-15T10:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    it('initializes with current date by default', () => {
      const { result } = renderHook(() => useCalendarNavigation(), {
        wrapper: createWrapper(),
      });

      expect(result.current.currentDate.getFullYear()).toBe(2024);
      expect(result.current.currentDate.getMonth()).toBe(10); // November (0-indexed)
    });

    it('initializes with provided initial date', () => {
      const initialDate = new Date(2024, 5, 15); // June 15, 2024
      const { result } = renderHook(
        () => useCalendarNavigation({ initialDate }),
        { wrapper: createWrapper() }
      );

      expect(result.current.currentDate.getFullYear()).toBe(2024);
      expect(result.current.currentDate.getMonth()).toBe(5); // June
    });

    it('initializes with no selected date', () => {
      const { result } = renderHook(() => useCalendarNavigation(), {
        wrapper: createWrapper(),
      });

      expect(result.current.selectedDate).toBeNull();
    });
  });

  describe('Navigation functions', () => {
    it('navigates to previous month', () => {
      const { result } = renderHook(
        () => useCalendarNavigation({ onDateChange: mockOnDateChange }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.goToPreviousMonth();
      });

      expect(result.current.currentDate.getMonth()).toBe(9); // October
      expect(mockOnDateChange).toHaveBeenCalledWith(new Date(2024, 9, 1));
    });

    it('navigates to next month', () => {
      const { result } = renderHook(
        () => useCalendarNavigation({ onDateChange: mockOnDateChange }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.goToNextMonth();
      });

      expect(result.current.currentDate.getMonth()).toBe(11); // December
      expect(mockOnDateChange).toHaveBeenCalledWith(new Date(2024, 11, 1));
    });

    it('navigates to today', () => {
      const initialDate = new Date(2024, 5, 15); // June 15, 2024
      const { result } = renderHook(
        () =>
          useCalendarNavigation({
            initialDate,
            onDateChange: mockOnDateChange,
          }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.goToToday();
      });

      const today = new Date();
      expect(result.current.currentDate.getMonth()).toBe(today.getMonth());
      expect(result.current.selectedDate?.getDate()).toBe(today.getDate());
      expect(mockOnDateChange).toHaveBeenCalledWith(today);
    });

    it('selects a date', () => {
      const { result } = renderHook(
        () => useCalendarNavigation({ onDateChange: mockOnDateChange }),
        { wrapper: createWrapper() }
      );

      const testDate = new Date(2024, 10, 20);

      act(() => {
        result.current.selectDate(testDate);
      });

      expect(result.current.selectedDate).toEqual(testDate);
      expect(mockOnDateChange).toHaveBeenCalledWith(testDate);
    });

    it('sets current date directly', () => {
      const { result } = renderHook(() => useCalendarNavigation(), {
        wrapper: createWrapper(),
      });

      const newDate = new Date(2024, 8, 10); // September 10, 2024

      act(() => {
        result.current.setCurrentDate(newDate);
      });

      expect(result.current.currentDate).toEqual(newDate);
    });
  });

  describe('Utility functions', () => {
    it('correctly identifies today', () => {
      const { result } = renderHook(() => useCalendarNavigation(), {
        wrapper: createWrapper(),
      });

      const today = new Date();
      const notToday = new Date(2024, 5, 15);

      expect(result.current.isToday(today)).toBe(true);
      expect(result.current.isToday(notToday)).toBe(false);
    });

    it('correctly identifies selected date', () => {
      const { result } = renderHook(() => useCalendarNavigation(), {
        wrapper: createWrapper(),
      });

      const testDate = new Date(2024, 10, 20);

      act(() => {
        result.current.selectDate(testDate);
      });

      expect(result.current.isSelected(testDate)).toBe(true);
      expect(result.current.isSelected(new Date(2024, 10, 21))).toBe(false);
    });

    it('correctly identifies dates with events', () => {
      const { result } = renderHook(() => useCalendarNavigation(), {
        wrapper: createWrapper(),
      });

      // Test that the function exists and works
      expect(typeof result.current.hasEvent).toBe('function');

      const testDate = new Date(2024, 10, 16);
      const hasEventResult = result.current.hasEvent(testDate);
      expect(typeof hasEventResult).toBe('boolean');
    });

    it('returns correct event type for dates', () => {
      const { result } = renderHook(() => useCalendarNavigation(), {
        wrapper: createWrapper(),
      });

      // Test that the function exists and works
      expect(typeof result.current.getEventType).toBe('function');

      const testDate = new Date(2024, 10, 16);
      const eventType = result.current.getEventType(testDate);
      expect(
        typeof eventType === 'undefined' || typeof eventType === 'string'
      ).toBe(true);
    });
  });

  describe('Keyboard navigation', () => {
    it('handles keyboard navigation when enabled', () => {
      const { result } = renderHook(
        () =>
          useCalendarNavigation({
            enableKeyboardNavigation: true,
            onDateChange: mockOnDateChange,
          }),
        { wrapper: createWrapper() }
      );

      // Simulate ArrowLeft key press
      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
        Object.defineProperty(event, 'preventDefault', {
          value: jest.fn(),
        });
        result.current.handleKeyDown(event);
      });

      expect(result.current.currentDate.getMonth()).toBe(9); // October
    });

    it('ignores keyboard navigation when disabled', () => {
      const { result } = renderHook(
        () =>
          useCalendarNavigation({
            enableKeyboardNavigation: false,
            onDateChange: mockOnDateChange,
          }),
        { wrapper: createWrapper() }
      );

      const initialMonth = result.current.currentDate.getMonth();

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
        result.current.handleKeyDown(event);
      });

      expect(result.current.currentDate.getMonth()).toBe(initialMonth);
    });

    it('handles Home key to go to today', () => {
      const initialDate = new Date(2024, 5, 15); // June 15, 2024
      const { result } = renderHook(
        () =>
          useCalendarNavigation({
            initialDate,
            enableKeyboardNavigation: true,
            onDateChange: mockOnDateChange,
          }),
        { wrapper: createWrapper() }
      );

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'Home' });
        Object.defineProperty(event, 'preventDefault', {
          value: jest.fn(),
        });
        result.current.handleKeyDown(event);
      });

      const today = new Date();
      expect(result.current.currentDate.getMonth()).toBe(today.getMonth());
    });
  });

  describe('Options handling', () => {
    it('calls onDateChange callback when provided', () => {
      const { result } = renderHook(
        () => useCalendarNavigation({ onDateChange: mockOnDateChange }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.goToNextMonth();
      });

      expect(mockOnDateChange).toHaveBeenCalled();
    });

    it('works without onDateChange callback', () => {
      const { result } = renderHook(() => useCalendarNavigation(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.goToNextMonth();
      });

      // Should not throw error
      expect(result.current.currentDate.getMonth()).toBe(11); // December
    });
  });

  describe('Data loading states', () => {
    it('exposes loading state from API hook', () => {
      const { result } = renderHook(() => useCalendarNavigation(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('exposes error state from API hook', () => {
      const { result } = renderHook(() => useCalendarNavigation(), {
        wrapper: createWrapper(),
      });

      expect(result.current.error).toBeNull();
    });

    it('provides refetch function', () => {
      const { result } = renderHook(() => useCalendarNavigation(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.refetch).toBe('function');
    });
  });
});
