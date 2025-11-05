import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  useCalendarEvents,
  usePrefetchCalendarEvents,
} from './api/useCalendar';
import { transformEventsForCalendar } from './api/useCalendar';

export interface UseCalendarNavigationOptions {
  initialDate?: Date;
  onDateChange?: (date: Date) => void;
  enableKeyboardNavigation?: boolean;
  prefetchAdjacentMonths?: boolean;
}

export const useCalendarNavigation = ({
  initialDate = new Date(),
  onDateChange,
  enableKeyboardNavigation = true,
  prefetchAdjacentMonths = true,
}: UseCalendarNavigationOptions = {}) => {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Fetch calendar events for current month
  const {
    data: eventsResponse,
    isLoading,
    error,
    refetch,
  } = useCalendarEvents(year, month);

  const { prefetchMonth } = usePrefetchCalendarEvents();

  // Transform events for UI consumption
  const events = useMemo(() => {
    return eventsResponse?.data
      ? transformEventsForCalendar(eventsResponse.data)
      : [];
  }, [eventsResponse]);

  // Navigation functions
  const goToPreviousMonth = useCallback(() => {
    const prevMonth = new Date(year, month - 1, 1);
    setCurrentDate(prevMonth);
    onDateChange?.(prevMonth);
  }, [year, month, onDateChange]);

  const goToNextMonth = useCallback(() => {
    const nextMonth = new Date(year, month + 1, 1);
    setCurrentDate(nextMonth);
    onDateChange?.(nextMonth);
  }, [year, month, onDateChange]);

  const goToToday = useCallback(() => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
    onDateChange?.(today);
  }, [onDateChange]);

  const selectDate = useCallback(
    (date: Date) => {
      setSelectedDate(date);
      onDateChange?.(date);
    },
    [onDateChange]
  );

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enableKeyboardNavigation) return;

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          goToPreviousMonth();
          break;
        case 'ArrowRight':
          event.preventDefault();
          goToNextMonth();
          break;
        case 'Home':
          event.preventDefault();
          goToToday();
          break;
        case 'Enter':
        case ' ':
          if (selectedDate) {
            event.preventDefault();
            selectDate(selectedDate);
          }
          break;
      }
    },
    [
      enableKeyboardNavigation,
      goToPreviousMonth,
      goToNextMonth,
      goToToday,
      selectedDate,
      selectDate,
    ]
  );

  // Prefetch adjacent months for better performance
  useEffect(() => {
    if (prefetchAdjacentMonths) {
      const prevMonth = new Date(year, month - 1, 1);
      const nextMonth = new Date(year, month + 1, 1);

      prefetchMonth(prevMonth.getFullYear(), prevMonth.getMonth());
      prefetchMonth(nextMonth.getFullYear(), nextMonth.getMonth());
    }
  }, [year, month, prefetchAdjacentMonths, prefetchMonth]);

  // Set up keyboard event listeners
  useEffect(() => {
    if (enableKeyboardNavigation) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [enableKeyboardNavigation, handleKeyDown]);

  // Utility functions
  const isToday = useCallback((date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }, []);

  const isSelected = useCallback(
    (date: Date) => {
      if (!selectedDate) return false;
      return (
        date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear()
      );
    },
    [selectedDate]
  );

  const hasEvent = useCallback(
    (date: Date) => {
      const dateString = date.toISOString().split('T')[0];
      return events.some((event) => event.date === dateString);
    },
    [events]
  );

  const getEventType = useCallback(
    (date: Date) => {
      const dateString = date.toISOString().split('T')[0];
      const event = events.find((event) => event.date === dateString);
      return event?.type;
    },
    [events]
  );

  return {
    // State
    currentDate,
    selectedDate,
    events,
    isLoading,
    error,

    // Navigation functions
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    selectDate,
    setCurrentDate,

    // Utility functions
    isToday,
    isSelected,
    hasEvent,
    getEventType,
    refetch,

    // Accessibility
    handleKeyDown,
  };
};
