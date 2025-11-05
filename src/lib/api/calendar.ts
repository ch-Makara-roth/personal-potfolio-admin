import { apiRequest } from './client';

export const calendarApi = {
  getEvents: async (
    year: number,
    month: number
  ): Promise<
    import('@/types/api').ApiResponse<import('@/types/api').CalendarEvent[]>
  > => {
    return apiRequest<import('@/types/api').CalendarEvent[]>(
      `/calendar/events?year=${year}&month=${month}`
    );
  },
  getEventsByDateRange: async (
    startDate: string,
    endDate: string
  ): Promise<
    import('@/types/api').ApiResponse<import('@/types/api').CalendarEvent[]>
  > => {
    return apiRequest<import('@/types/api').CalendarEvent[]>(
      `/calendar/events?start=${startDate}&end=${endDate}`
    );
  },
};
