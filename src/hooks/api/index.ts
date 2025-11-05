export * from './useAdminBlogPosts';
export * from './useAdminComments';
export * from './useAdminContacts';

// API hooks will be exported from here

export {
  useDashboardStats,
  useStatByType,
  useRefreshDashboardStats,
  dashboardQueryKeys,
  statsTransformers,
} from './useDashboardStats';

export {
  useCalendarEvents,
  useCalendarEventsByDateRange,
  usePrefetchCalendarEvents,
  useCurrentMonthEvents,
  calendarKeys,
  transformEventsForCalendar,
} from './useCalendar';

export {
  useUpcomingInterviews,
  useInterviewsByDate,
  usePrefetchInterviews,
  useTodayInterviews,
  useHasInterviewsToday,
  interviewKeys,
  transformInterviewsForUI,
} from './useInterviews';

export {
  useHiringSources,
  useHiringSourcesByCategory,
  useRefreshHiringSources,
  useHiringSourcesRealTime,
  hiringSourcesQueryKeys,
  hiringSourcesTransformers,
} from './useHiringSources';

export {
  useJobs,
  useJob,
  useCreateJob,
  useUpdateJob,
  useUpdateJobStatus,
  useDeleteJob,
  useDuplicateJob,
  useJobActions,
  jobsKeys,
} from './useJobs';

export {
  useCurrentPlan,
  useAvailablePlans,
  useInitiateUpgrade,
  useTrackUpgradeEvent,
  useCancelSubscription,
  useIsOnPlan,
  useCanAccessFeature,
  useUpgradeActions,
  upgradeKeys,
  upgradeTransformers,
} from './useUpgrade';

export {
  useProfile,
  useUpdateProfile,
  useChangePassword,
  authKeys,
} from './useProfile';
