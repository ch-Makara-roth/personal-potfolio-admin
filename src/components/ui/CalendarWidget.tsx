'use client';

import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
import type { CalendarWidgetProps } from '@/types/ui';

const calendarVariants = cva(
  'bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden',
  {
    variants: {
      size: {
        default: 'w-full max-w-sm',
        compact: 'w-full max-w-xs',
        full: 'w-full',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

const dateVariants = cva(
  'w-8 h-8 flex items-center justify-center text-sm rounded-lg transition-colors cursor-pointer relative',
  {
    variants: {
      variant: {
        default: 'text-gray-700 hover:bg-gray-100',
        today: 'bg-purple-100 text-purple-700 font-medium',
        selected: 'bg-purple-600 text-white font-medium',
        otherMonth: 'text-gray-400 hover:bg-gray-50',
        hasEvent: 'text-gray-700 hover:bg-gray-100',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface CalendarWidgetComponentProps
  extends CalendarWidgetProps, VariantProps<typeof calendarVariants> {}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const CalendarWidget: React.FC<CalendarWidgetComponentProps> = ({
  currentDate,
  events = [],
  onMonthChange,
  onDateClick,
  size,
  className,
  ...props
}) => {
  const { calendarDays, monthYear } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Get first day of the month and how many days in month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Get days from previous month to fill the grid
    const prevMonth = new Date(year, month - 1, 0);
    const daysInPrevMonth = prevMonth.getDate();

    const days: Array<{
      date: Date;
      day: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      hasEvent: boolean;
      eventType?: string;
    }> = [];

    // Add days from previous month
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const date = new Date(year, month - 1, day);
      days.push({
        date,
        day,
        isCurrentMonth: false,
        isToday: false,
        hasEvent: false,
      });
    }

    // Add days from current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      const hasEvent = events.some((event) => event.date === dateString);
      const eventType = events.find((event) => event.date === dateString)?.type;
      const isToday =
        date.getDate() === new Date().getDate() &&
        date.getMonth() === new Date().getMonth() &&
        date.getFullYear() === new Date().getFullYear();

      days.push({
        date,
        day,
        isCurrentMonth: true,
        isToday,
        hasEvent,
        eventType,
      });
    }

    // Add days from next month to complete the grid (42 days = 6 weeks)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        day,
        isCurrentMonth: false,
        isToday: false,
        hasEvent: false,
      });
    }

    return {
      calendarDays: days,
      monthYear: `${MONTHS[month]} ${year}`,
    };
  }, [currentDate, events]);

  const handlePrevMonth = () => {
    const prevMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      1
    );
    onMonthChange(prevMonth);
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      1
    );
    onMonthChange(nextMonth);
  };

  const handleDateClick = (date: Date) => {
    onDateClick?.(date);
  };

  const getEventDotColor = (eventType?: string) => {
    switch (eventType) {
      case 'interview':
        return 'bg-blue-500';
      case 'deadline':
        return 'bg-red-500';
      case 'meeting':
        return 'bg-green-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className={cn(calendarVariants({ size }), className)} {...props}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <button
          type="button"
          onClick={handlePrevMonth}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handlePrevMonth();
            }
          }}
          className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        <h3 className="text-lg font-semibold text-gray-900">{monthYear}</h3>

        <button
          type="button"
          onClick={handleNextMonth}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleNextMonth();
            }
          }}
          className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 p-4 pb-2">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day}
            className="text-xs font-medium text-gray-500 text-center py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 p-4 pt-0">
        {calendarDays.map((dayInfo, index) => {
          const variant = dayInfo.isToday
            ? 'today'
            : dayInfo.isCurrentMonth
              ? dayInfo.hasEvent
                ? 'hasEvent'
                : 'default'
              : 'otherMonth';

          return (
            <button
              key={index}
              onClick={() => handleDateClick(dayInfo.date)}
              className={cn(dateVariants({ variant }))}
              aria-label={`${dayInfo.date.toLocaleDateString()}`}
            >
              {dayInfo.day}
              {dayInfo.hasEvent && (
                <div
                  className={cn(
                    'absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full',
                    getEventDotColor(dayInfo.eventType)
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const calendarWidgetVariants = calendarVariants;
