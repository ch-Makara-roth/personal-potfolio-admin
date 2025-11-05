import { useState, useCallback, useMemo } from 'react';
import {
  useUpcomingInterviews,
  transformInterviewsForUI,
} from './api/useInterviews';
import type { Interview } from '@/types/api';

export interface UseInterviewManagementOptions {
  maxVisible?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useInterviewManagement = ({
  maxVisible = 5,
  autoRefresh = true,
  refreshInterval = 5 * 60 * 1000, // 5 minutes
}: UseInterviewManagementOptions = {}) => {
  const [selectedInterview, setSelectedInterview] = useState<string | null>(
    null
  );
  const [expandedView, setExpandedView] = useState(false);

  // Fetch upcoming interviews
  const {
    data: interviewsResponse,
    isLoading,
    error,
    refetch,
  } = useUpcomingInterviews();

  const interviews = useMemo(() => {
    return interviewsResponse?.data ?? [];
  }, [interviewsResponse]);

  // Transform interviews for UI
  const transformedInterviews = useMemo(() => {
    return transformInterviewsForUI(interviews);
  }, [interviews]);

  // Get interviews to display based on maxVisible and expandedView
  const displayedInterviews = useMemo(() => {
    if (expandedView) {
      return transformedInterviews;
    }
    return transformedInterviews.slice(0, maxVisible);
  }, [transformedInterviews, maxVisible, expandedView]);

  // Check if there are more interviews than displayed
  const hasMoreInterviews = transformedInterviews.length > maxVisible;

  // Get today's interviews
  const todayInterviews = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return transformedInterviews.filter((interview) => {
      const interviewDate = new Date(interview.timeSlot.start)
        .toISOString()
        .split('T')[0];
      return interviewDate === today;
    });
  }, [transformedInterviews]);

  // Get upcoming interviews (excluding today)
  const upcomingInterviews = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return transformedInterviews.filter((interview) => {
      const interviewDate = new Date(interview.timeSlot.start)
        .toISOString()
        .split('T')[0];
      return interviewDate > today;
    });
  }, [transformedInterviews]);

  // Interview management functions
  const selectInterview = useCallback((interviewId: string) => {
    setSelectedInterview(interviewId);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedInterview(null);
  }, []);

  const toggleExpandedView = useCallback(() => {
    setExpandedView((prev) => !prev);
  }, []);

  const showAllInterviews = useCallback(() => {
    setExpandedView(true);
  }, []);

  const showLimitedInterviews = useCallback(() => {
    setExpandedView(false);
  }, []);

  // Get interview by ID
  const getInterviewById = useCallback(
    (id: string) => {
      return transformedInterviews.find((interview) => interview.id === id);
    },
    [transformedInterviews]
  );

  // Check if interview is selected
  const isInterviewSelected = useCallback(
    (id: string) => {
      return selectedInterview === id;
    },
    [selectedInterview]
  );

  // Get next interview
  const nextInterview = useMemo(() => {
    if (transformedInterviews.length === 0) return null;

    const now = new Date();
    const upcoming = transformedInterviews
      .filter((interview) => new Date(interview.timeSlot.start) > now)
      .sort(
        (a, b) =>
          new Date(a.timeSlot.start).getTime() -
          new Date(b.timeSlot.start).getTime()
      );

    return upcoming[0] || null;
  }, [transformedInterviews]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: transformedInterviews.length,
      today: todayInterviews.length,
      upcoming: upcomingInterviews.length,
      hasNext: !!nextInterview,
    };
  }, [
    transformedInterviews.length,
    todayInterviews.length,
    upcomingInterviews.length,
    nextInterview,
  ]);

  // Keyboard navigation for interviews
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (transformedInterviews.length === 0) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          if (!selectedInterview) {
            selectInterview(transformedInterviews[0].id);
          } else {
            const currentIndex = transformedInterviews.findIndex(
              (interview) => interview.id === selectedInterview
            );
            const nextIndex = (currentIndex + 1) % transformedInterviews.length;
            selectInterview(transformedInterviews[nextIndex].id);
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          if (!selectedInterview) {
            selectInterview(
              transformedInterviews[transformedInterviews.length - 1].id
            );
          } else {
            const currentIndex = transformedInterviews.findIndex(
              (interview) => interview.id === selectedInterview
            );
            const prevIndex =
              currentIndex === 0
                ? transformedInterviews.length - 1
                : currentIndex - 1;
            selectInterview(transformedInterviews[prevIndex].id);
          }
          break;
        case 'Escape':
          event.preventDefault();
          clearSelection();
          break;
        case 'Enter':
        case ' ':
          if (selectedInterview) {
            event.preventDefault();
            // Could trigger interview details view or action
          }
          break;
      }
    },
    [transformedInterviews, selectedInterview, selectInterview, clearSelection]
  );

  return {
    // Data
    interviews: transformedInterviews,
    displayedInterviews,
    todayInterviews,
    upcomingInterviews,
    nextInterview,
    stats,

    // State
    selectedInterview,
    expandedView,
    isLoading,
    error,
    hasMoreInterviews,

    // Actions
    selectInterview,
    clearSelection,
    toggleExpandedView,
    showAllInterviews,
    showLimitedInterviews,
    refetch,

    // Utilities
    getInterviewById,
    isInterviewSelected,
    handleKeyDown,
  };
};
