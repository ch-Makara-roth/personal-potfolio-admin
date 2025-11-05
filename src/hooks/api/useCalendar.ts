import { useQuery, useQueryClient } from '@tanstack/react-query';
import { calendarApi, getMockCalendarEvents } from '@/lib/api';
import type { CalendarEvent } from '@/types/api';

// Query keys for calendar data
export const calendarKeys = {
  all: ['calendar'] as const,
  events: () => [...calendarKeys.all, 'events'] as const,
  eventsByMonth: (year: number, month: number) =>
    [...calendarKeys.events(), 'month', year, month] as const,
  eventsByDateRange: (startDate: string, endDate: string) =>
    [...calendarKeys.events(), 'range', startDate, endDate] as const,
};

// Hook to fetch calendar events for a specific month
export const useCalendarEvents = (year: number, month: number) => {
  return useQuery({
    queryKey: calendarKeys.eventsByMonth(year, month),
    queryFn: async () => {
      // Use mock data in development
      if (process.env.NODE_ENV === 'development') {
        return getMockCalendarEvents(year, month);
      }
      return calendarApi.getEvents(year, month);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Hook to fetch calendar events for a date range
export const useCalendarEventsByDateRange = (
  startDate: string,
  endDate: string
) => {
  return useQuery({
    queryKey: calendarKeys.eventsByDateRange(startDate, endDate),
    queryFn: async () => {
      // Use mock data in development
      if (process.env.NODE_ENV === 'development') {
        return getMockCalendarEvents(
          new Date(startDate).getFullYear(),
          new Date(startDate).getMonth()
        );
      }
      return calendarApi.getEventsByDateRange(startDate, endDate);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!startDate && !!endDate,
  });
};

// Hook to prefetch calendar events for adjacent months
export const usePrefetchCalendarEvents = () => {
  const queryClient = useQueryClient();

  const prefetchMonth = async (year: number, month: number) => {
    await queryClient.prefetchQuery({
      queryKey: calendarKeys.eventsByMonth(year, month),
      queryFn: async () => {
        if (process.env.NODE_ENV === 'development') {
          return getMockCalendarEvents(year, month);
        }
        return calendarApi.getEvents(year, month);
      },
      staleTime: 5 * 60 * 1000,
    });
  };

  return { prefetchMonth };
};

// Utility hook to get events for the current month
export const useCurrentMonthEvents = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  return useCalendarEvents(year, month);
};

// Utility function to transform API events to UI format
export const transformEventsForCalendar = (events: CalendarEvent[]) => {
  return events.map((event) => ({
    date: event.date,
    type: event.type,
    title: event.title,
  }));
};
