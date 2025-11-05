import { useQuery, useQueryClient } from '@tanstack/react-query';
import { interviewApi, getMockInterviews } from '@/lib/api';
import type { Interview } from '@/types/api';

// Query keys for interview data
export const interviewKeys = {
  all: ['interviews'] as const,
  upcoming: () => [...interviewKeys.all, 'upcoming'] as const,
  upcomingWithLimit: (limit: number) =>
    [...interviewKeys.upcoming(), 'limit', limit] as const,
  byDate: (date: string) => [...interviewKeys.all, 'date', date] as const,
};

// Hook to fetch upcoming interviews
export const useUpcomingInterviews = (limit?: number) => {
  return useQuery({
    queryKey: limit
      ? interviewKeys.upcomingWithLimit(limit)
      : interviewKeys.upcoming(),
    queryFn: async () => {
      // Use mock data in development
      if (process.env.NODE_ENV === 'development') {
        return getMockInterviews(limit);
      }
      return interviewApi.getUpcoming(limit);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (interviews change more frequently)
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes for real-time updates
  });
};

// Hook to fetch interviews for a specific date
export const useInterviewsByDate = (date: string) => {
  return useQuery({
    queryKey: interviewKeys.byDate(date),
    queryFn: async () => {
      // Use mock data in development
      if (process.env.NODE_ENV === 'development') {
        // Filter mock interviews by date
        const mockResponse = await getMockInterviews();
        const filteredInterviews = mockResponse.data.filter((interview) => {
          const interviewDate = new Date(interview.timeSlot.start)
            .toISOString()
            .split('T')[0];
          return interviewDate === date;
        });
        return {
          ...mockResponse,
          data: filteredInterviews,
        };
      }
      return interviewApi.getByDate(date);
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!date,
  });
};

// Hook to prefetch interviews for upcoming dates
export const usePrefetchInterviews = () => {
  const queryClient = useQueryClient();

  const prefetchUpcoming = async (limit?: number) => {
    await queryClient.prefetchQuery({
      queryKey: limit
        ? interviewKeys.upcomingWithLimit(limit)
        : interviewKeys.upcoming(),
      queryFn: async () => {
        if (process.env.NODE_ENV === 'development') {
          return getMockInterviews(limit);
        }
        return interviewApi.getUpcoming(limit);
      },
      staleTime: 2 * 60 * 1000,
    });
  };

  const prefetchByDate = async (date: string) => {
    await queryClient.prefetchQuery({
      queryKey: interviewKeys.byDate(date),
      queryFn: async () => {
        if (process.env.NODE_ENV === 'development') {
          const mockResponse = await getMockInterviews();
          const filteredInterviews = mockResponse.data.filter((interview) => {
            const interviewDate = new Date(interview.timeSlot.start)
              .toISOString()
              .split('T')[0];
            return interviewDate === date;
          });
          return {
            ...mockResponse,
            data: filteredInterviews,
          };
        }
        return interviewApi.getByDate(date);
      },
      staleTime: 2 * 60 * 1000,
    });
  };

  return { prefetchUpcoming, prefetchByDate };
};

// Utility function to transform API interviews to UI format
export const transformInterviewsForUI = (interviews: Interview[]) => {
  return interviews.map((interview) => ({
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
  }));
};

// Utility function to get today's interviews
export const useTodayInterviews = () => {
  const today = new Date().toISOString().split('T')[0];
  return useInterviewsByDate(today);
};

// Utility function to check if there are interviews today
export const useHasInterviewsToday = () => {
  const { data: todayInterviews } = useTodayInterviews();
  return (todayInterviews?.data?.length ?? 0) > 0;
};
