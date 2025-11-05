'use client';

import React from 'react';
import { Clock, Calendar } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
import { Avatar, AvatarImage, AvatarFallback } from './Avatar';
import { Badge } from './Badge';
import type { UpcomingInterviewsProps } from '@/types/ui';

const upcomingInterviewsVariants = cva(
  'bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden',
  {
    variants: {
      size: {
        default: 'w-full',
        compact: 'w-full max-w-sm',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

const interviewCardVariants = cva(
  'flex items-center gap-3 p-4 transition-colors hover:bg-gray-50 border-b border-gray-100 last:border-b-0',
  {
    variants: {
      variant: {
        default: 'bg-white',
        highlighted: 'bg-blue-50 border-blue-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface UpcomingInterviewsComponentProps
  extends UpcomingInterviewsProps,
    VariantProps<typeof upcomingInterviewsVariants> {}

const formatTimeSlot = (start: string, end: string): string => {
  const startTime = new Date(start);
  const endTime = new Date(end);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false,
    });
  };

  return `${formatTime(startTime)}-${formatTime(endTime)}`;
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const isToday = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

const isTomorrow = (dateString: string): boolean => {
  const date = new Date(dateString);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()
  );
};

const formatDate = (dateString: string): string => {
  if (isToday(dateString)) return 'Today';
  if (isTomorrow(dateString)) return 'Tomorrow';

  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

export const UpcomingInterviews: React.FC<UpcomingInterviewsComponentProps> = ({
  interviews = [],
  maxVisible = 5,
  size,
  className,
  ...props
}) => {
  const displayedInterviews = interviews.slice(0, maxVisible);
  const hasMoreInterviews = interviews.length > maxVisible;

  if (interviews.length === 0) {
    return (
      <div
        className={cn(upcomingInterviewsVariants({ size }), className)}
        {...props}
      >
        <div className="p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Calendar className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No upcoming interviews
          </h3>
          <p className="text-sm text-gray-500">
            Your interview schedule is clear. New interviews will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(upcomingInterviewsVariants({ size }), className)}
      {...props}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Upcoming Interviews
          </h3>
          <Badge variant="secondary" size="sm">
            {interviews.length}
          </Badge>
        </div>
      </div>

      {/* Interview List */}
      <div className="divide-y divide-gray-100">
        {displayedInterviews.map((interview) => {
          const timeSlot = formatTimeSlot(
            interview.timeSlot.start,
            interview.timeSlot.end
          );
          const dateLabel = formatDate(interview.timeSlot.start);
          const isHighlighted = isToday(interview.timeSlot.start);

          return (
            <div
              key={interview.id}
              className={cn(
                interviewCardVariants({
                  variant: isHighlighted ? 'highlighted' : 'default',
                })
              )}
            >
              {/* Avatar */}
              <Avatar size="md">
                <AvatarImage
                  src={interview.candidate.avatar}
                  alt={interview.candidate.name}
                />
                <AvatarFallback>
                  {getInitials(interview.candidate.name)}
                </AvatarFallback>
              </Avatar>

              {/* Interview Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {interview.candidate.name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {interview.candidate.role}
                    </p>
                  </div>

                  <div className="ml-3 flex flex-col items-end gap-1">
                    <Badge
                      variant="outline"
                      size="sm"
                      className="bg-blue-50 text-blue-700 border-blue-200"
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      {timeSlot}
                    </Badge>
                    <span className="text-xs text-gray-500">{dateLabel}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show More Footer */}
      {hasMoreInterviews && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
            View {interviews.length - maxVisible} more interviews
          </button>
        </div>
      )}
    </div>
  );
};

export { upcomingInterviewsVariants };
