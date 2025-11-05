import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// User preference types
export interface DashboardPreferences {
  // Widget visibility
  showStatsCards: boolean;
  showCalendar: boolean;
  showUpcomingInterviews: boolean;
  showHiringChart: boolean;
  showJobsTable: boolean;
  showUpgradeCard: boolean;

  // Widget order and layout
  widgetOrder: string[];
  gridLayout: 'default' | 'compact' | 'wide';

  // Data refresh preferences
  autoRefresh: boolean;
  refreshInterval: number; // in minutes

  // Chart preferences
  chartAnimations: boolean;
  chartColors: 'default' | 'colorblind' | 'high-contrast';
}

export interface TablePreferences {
  // Jobs table preferences
  jobsTablePageSize: number;
  jobsTableSortBy: string;
  jobsTableSortDirection: 'asc' | 'desc';
  jobsTableVisibleColumns: string[];

  // General table preferences
  showRowNumbers: boolean;
  enableRowSelection: boolean;
  compactRows: boolean;
  stickyHeaders: boolean;
}

export interface CalendarPreferences {
  // Calendar view preferences
  defaultView: 'month' | 'week' | 'day';
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, etc.
  showWeekNumbers: boolean;

  // Event preferences
  showEventDetails: boolean;
  eventColorCoding: boolean;

  // Time preferences
  timeFormat: '12h' | '24h';
  timezone: string;
}

export interface AccessibilityPreferences {
  // Screen reader preferences
  announceChanges: boolean;
  verboseDescriptions: boolean;

  // Keyboard navigation
  enableKeyboardShortcuts: boolean;
  showKeyboardHints: boolean;

  // Visual preferences
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  lineHeight: 'normal' | 'relaxed' | 'loose';
  letterSpacing: 'normal' | 'wide' | 'wider';

  // Focus preferences
  enhancedFocusIndicators: boolean;
  skipToContentLink: boolean;
}

// User Preferences State Interface
interface UserPreferencesState {
  // Preference categories
  dashboard: DashboardPreferences;
  table: TablePreferences;
  calendar: CalendarPreferences;
  accessibility: AccessibilityPreferences;

  // General preferences
  language: string;
  dateFormat: string;
  numberFormat: string;
  currency: string;

  // Onboarding and help
  hasCompletedOnboarding: boolean;
  showHelpTooltips: boolean;
  dismissedAnnouncements: string[];

  // Actions
  updateDashboardPreferences: (
    preferences: Partial<DashboardPreferences>
  ) => void;
  updateTablePreferences: (preferences: Partial<TablePreferences>) => void;
  updateCalendarPreferences: (
    preferences: Partial<CalendarPreferences>
  ) => void;
  updateAccessibilityPreferences: (
    preferences: Partial<AccessibilityPreferences>
  ) => void;

  setLanguage: (language: string) => void;
  setDateFormat: (format: string) => void;
  setNumberFormat: (format: string) => void;
  setCurrency: (currency: string) => void;

  completeOnboarding: () => void;
  toggleHelpTooltips: () => void;
  dismissAnnouncement: (announcementId: string) => void;

  // Reset functions
  resetDashboardPreferences: () => void;
  resetTablePreferences: () => void;
  resetCalendarPreferences: () => void;
  resetAccessibilityPreferences: () => void;
  resetAllPreferences: () => void;

  // Export/Import
  exportPreferences: () => string;
  importPreferences: (preferences: string) => boolean;
}

// Default preferences
const defaultDashboardPreferences: DashboardPreferences = {
  showStatsCards: true,
  showCalendar: true,
  showUpcomingInterviews: true,
  showHiringChart: true,
  showJobsTable: true,
  showUpgradeCard: true,
  widgetOrder: ['stats', 'calendar-interviews', 'hiring-chart', 'jobs-upgrade'],
  gridLayout: 'default',
  autoRefresh: true,
  refreshInterval: 5, // 5 minutes
  chartAnimations: true,
  chartColors: 'default',
};

const defaultTablePreferences: TablePreferences = {
  jobsTablePageSize: 10,
  jobsTableSortBy: 'datePosted',
  jobsTableSortDirection: 'desc',
  jobsTableVisibleColumns: [
    'title',
    'applicationCount',
    'datePosted',
    'status',
    'actions',
  ],
  showRowNumbers: false,
  enableRowSelection: true,
  compactRows: false,
  stickyHeaders: true,
};

const defaultCalendarPreferences: CalendarPreferences = {
  defaultView: 'month',
  weekStartsOn: 1, // Monday
  showWeekNumbers: false,
  showEventDetails: true,
  eventColorCoding: true,
  timeFormat: '12h',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
};

const defaultAccessibilityPreferences: AccessibilityPreferences = {
  announceChanges: true,
  verboseDescriptions: false,
  enableKeyboardShortcuts: true,
  showKeyboardHints: false,
  fontSize: 'medium',
  lineHeight: 'normal',
  letterSpacing: 'normal',
  enhancedFocusIndicators: false,
  skipToContentLink: true,
};

// Create user preferences store with persistence
export const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    (set, get) => ({
      // Default state
      dashboard: defaultDashboardPreferences,
      table: defaultTablePreferences,
      calendar: defaultCalendarPreferences,
      accessibility: defaultAccessibilityPreferences,

      language: 'en',
      dateFormat: 'MM/dd/yyyy',
      numberFormat: 'en-US',
      currency: 'USD',

      hasCompletedOnboarding: false,
      showHelpTooltips: true,
      dismissedAnnouncements: [],

      // Dashboard preference actions
      updateDashboardPreferences: (preferences) =>
        set((state) => ({
          dashboard: { ...state.dashboard, ...preferences },
        })),

      // Table preference actions
      updateTablePreferences: (preferences) =>
        set((state) => ({
          table: { ...state.table, ...preferences },
        })),

      // Calendar preference actions
      updateCalendarPreferences: (preferences) =>
        set((state) => ({
          calendar: { ...state.calendar, ...preferences },
        })),

      // Accessibility preference actions
      updateAccessibilityPreferences: (preferences) => {
        set((state) => ({
          accessibility: { ...state.accessibility, ...preferences },
        }));

        // Apply accessibility preferences to DOM
        if (typeof document !== 'undefined') {
          const root = document.documentElement;
          const newPrefs = { ...get().accessibility, ...preferences };

          // Apply font size
          root.style.setProperty(
            '--font-size-base',
            {
              small: '14px',
              medium: '16px',
              large: '18px',
              'extra-large': '20px',
            }[newPrefs.fontSize]
          );

          // Apply line height
          root.style.setProperty(
            '--line-height-base',
            {
              normal: '1.5',
              relaxed: '1.625',
              loose: '1.75',
            }[newPrefs.lineHeight]
          );

          // Apply letter spacing
          root.style.setProperty(
            '--letter-spacing-base',
            {
              normal: '0',
              wide: '0.025em',
              wider: '0.05em',
            }[newPrefs.letterSpacing]
          );

          // Apply enhanced focus indicators
          root.classList.toggle(
            'enhanced-focus',
            newPrefs.enhancedFocusIndicators
          );
        }
      },

      // General preference actions
      setLanguage: (language) => set({ language }),
      setDateFormat: (dateFormat) => set({ dateFormat }),
      setNumberFormat: (numberFormat) => set({ numberFormat }),
      setCurrency: (currency) => set({ currency }),

      // Onboarding and help actions
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      toggleHelpTooltips: () =>
        set((state) => ({
          showHelpTooltips: !state.showHelpTooltips,
        })),
      dismissAnnouncement: (announcementId) =>
        set((state) => ({
          dismissedAnnouncements: [
            ...state.dismissedAnnouncements,
            announcementId,
          ],
        })),

      // Reset functions
      resetDashboardPreferences: () =>
        set({
          dashboard: defaultDashboardPreferences,
        }),

      resetTablePreferences: () =>
        set({
          table: defaultTablePreferences,
        }),

      resetCalendarPreferences: () =>
        set({
          calendar: defaultCalendarPreferences,
        }),

      resetAccessibilityPreferences: () => {
        set({ accessibility: defaultAccessibilityPreferences });

        // Reset DOM styles
        if (typeof document !== 'undefined') {
          const root = document.documentElement;
          root.style.removeProperty('--font-size-base');
          root.style.removeProperty('--line-height-base');
          root.style.removeProperty('--letter-spacing-base');
          root.classList.remove('enhanced-focus');
        }
      },

      resetAllPreferences: () => {
        const state = get();
        state.resetDashboardPreferences();
        state.resetTablePreferences();
        state.resetCalendarPreferences();
        state.resetAccessibilityPreferences();

        set({
          language: 'en',
          dateFormat: 'MM/dd/yyyy',
          numberFormat: 'en-US',
          currency: 'USD',
          hasCompletedOnboarding: false,
          showHelpTooltips: true,
          dismissedAnnouncements: [],
        });
      },

      // Export/Import functions
      exportPreferences: () => {
        const state = get();
        const exportData = {
          dashboard: state.dashboard,
          table: state.table,
          calendar: state.calendar,
          accessibility: state.accessibility,
          language: state.language,
          dateFormat: state.dateFormat,
          numberFormat: state.numberFormat,
          currency: state.currency,
          showHelpTooltips: state.showHelpTooltips,
        };

        return JSON.stringify(exportData, null, 2);
      },

      importPreferences: (preferencesJson) => {
        try {
          const preferences = JSON.parse(preferencesJson);

          // Validate and apply preferences
          if (preferences.dashboard) {
            get().updateDashboardPreferences(preferences.dashboard);
          }
          if (preferences.table) {
            get().updateTablePreferences(preferences.table);
          }
          if (preferences.calendar) {
            get().updateCalendarPreferences(preferences.calendar);
          }
          if (preferences.accessibility) {
            get().updateAccessibilityPreferences(preferences.accessibility);
          }

          // Apply general preferences
          if (preferences.language) get().setLanguage(preferences.language);
          if (preferences.dateFormat)
            get().setDateFormat(preferences.dateFormat);
          if (preferences.numberFormat)
            get().setNumberFormat(preferences.numberFormat);
          if (preferences.currency) get().setCurrency(preferences.currency);
          if (typeof preferences.showHelpTooltips === 'boolean') {
            set({ showHelpTooltips: preferences.showHelpTooltips });
          }

          return true;
        } catch (error) {
          console.error('Failed to import preferences:', error);
          return false;
        }
      },
    }),
    {
      name: 'user-preferences-store',
      storage: createJSONStorage(() => localStorage),

      // Handle hydration for accessibility preferences
      onRehydrateStorage: () => (state) => {
        if (state && typeof document !== 'undefined') {
          const root = document.documentElement;
          const { accessibility } = state;

          // Apply accessibility preferences on hydration
          root.style.setProperty(
            '--font-size-base',
            {
              small: '14px',
              medium: '16px',
              large: '18px',
              'extra-large': '20px',
            }[accessibility.fontSize]
          );

          root.style.setProperty(
            '--line-height-base',
            {
              normal: '1.5',
              relaxed: '1.625',
              loose: '1.75',
            }[accessibility.lineHeight]
          );

          root.style.setProperty(
            '--letter-spacing-base',
            {
              normal: '0',
              wide: '0.025em',
              wider: '0.05em',
            }[accessibility.letterSpacing]
          );

          root.classList.toggle(
            'enhanced-focus',
            accessibility.enhancedFocusIndicators
          );
        }
      },
    }
  )
);

// Selectors for preference categories
export const selectDashboardPreferences = (state: UserPreferencesState) =>
  state.dashboard;
export const selectTablePreferences = (state: UserPreferencesState) =>
  state.table;
export const selectCalendarPreferences = (state: UserPreferencesState) =>
  state.calendar;
export const selectAccessibilityPreferences = (state: UserPreferencesState) =>
  state.accessibility;

// Hooks for specific preference categories
export const useDashboardPreferences = () =>
  useUserPreferencesStore(selectDashboardPreferences);
export const useTablePreferences = () =>
  useUserPreferencesStore(selectTablePreferences);
export const useCalendarPreferences = () =>
  useUserPreferencesStore(selectCalendarPreferences);
export const useAccessibilityPreferences = () =>
  useUserPreferencesStore(selectAccessibilityPreferences);

// Hook for preference actions
export const usePreferenceActions = () => {
  const store = useUserPreferencesStore();

  return {
    updateDashboardPreferences: store.updateDashboardPreferences,
    updateTablePreferences: store.updateTablePreferences,
    updateCalendarPreferences: store.updateCalendarPreferences,
    updateAccessibilityPreferences: store.updateAccessibilityPreferences,
    setLanguage: store.setLanguage,
    setDateFormat: store.setDateFormat,
    setNumberFormat: store.setNumberFormat,
    setCurrency: store.setCurrency,
    completeOnboarding: store.completeOnboarding,
    toggleHelpTooltips: store.toggleHelpTooltips,
    dismissAnnouncement: store.dismissAnnouncement,
    resetAllPreferences: store.resetAllPreferences,
    exportPreferences: store.exportPreferences,
    importPreferences: store.importPreferences,
  };
};
