import React, { useState } from 'react';
import {
  FileText,
  Calendar,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Edit,
  Pause,
  Play,
  Trash2,
  Copy,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils';
import type { Job, JobSortField, SortDirection } from '@/types/api';
import type { JobsTableProps } from '@/types/ui';

interface JobsTableColumn {
  key: JobSortField | 'actions';
  label: string;
  sortable: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

const columns: JobsTableColumn[] = [
  { key: 'title', label: 'Job Title', sortable: true, width: 'flex-1' },
  {
    key: 'applicationCount',
    label: 'Applications',
    sortable: true,
    width: 'w-32',
    align: 'center',
  },
  {
    key: 'datePosted',
    label: 'Date Posted',
    sortable: true,
    width: 'w-36',
    align: 'center',
  },
  {
    key: 'actions',
    label: 'Options',
    sortable: false,
    width: 'w-20',
    align: 'center',
  },
];

const JobsTable: React.FC<JobsTableProps> = ({
  jobs,
  loading = false,
  sortConfig,
  onSort,
  onJobAction,
  pagination,
  onPageChange,
  className,
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const handleSort = (field: string) => {
    if (onSort && field !== 'actions') {
      onSort(field);
    }
  };

  const getSortIcon = (field: string) => {
    if (!sortConfig || sortConfig.field !== field) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-purple-600" />
    ) : (
      <ChevronDown className="w-4 h-4 text-purple-600" />
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: Job['status']) => {
    const variants = {
      active: 'success',
      paused: 'warning',
      closed: 'secondary',
    } as const;

    return (
      <Badge variant={variants[status]} size="sm">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleActionClick = (jobId: string, action: string) => {
    setActiveDropdown(null);
    if (onJobAction) {
      onJobAction(jobId, action);
    }
  };

  const ActionDropdown: React.FC<{ job: JobsTableProps['jobs'][number] }> = ({
    job,
  }) => {
    const isOpen = activeDropdown === job.id;

    const actions = [
      { key: 'edit', label: 'Edit Job', icon: Edit },
      {
        key: job.status === 'paused' ? 'resume' : 'pause',
        label: job.status === 'paused' ? 'Resume' : 'Pause',
        icon: job.status === 'paused' ? Play : Pause,
      },
      { key: 'duplicate', label: 'Duplicate', icon: Copy },
      {
        key: 'delete',
        label: 'Delete',
        icon: Trash2,
        variant: 'destructive' as const,
      },
    ];

    return (
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveDropdown(isOpen ? null : job.id)}
          className="h-8 w-8 p-0"
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setActiveDropdown(null)}
            />
            <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
              {actions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.key}
                    onClick={() => handleActionClick(job.id, action.key)}
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors',
                      action.variant === 'destructive' &&
                        'text-red-600 hover:bg-red-50'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {action.label}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex space-x-4">
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-8"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      'px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider',
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right',
                      column.width
                    )}
                  >
                    {column.sortable ? (
                      <button
                        onClick={() => handleSort(column.key)}
                        className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                      >
                        {column.label}
                        {getSortIcon(column.key)}
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">
                        {job.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {getStatusBadge(job.status)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-1 text-sm text-gray-900">
                      <FileText className="w-4 h-4 text-purple-600" />
                      {job.applicationCount}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-1 text-sm text-gray-900">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      {formatDate(job.datePosted)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <ActionDropdown job={job} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4 p-4">
        {jobs.map((job) => (
          <div key={job.id} className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  {job.title}
                </h3>
                {getStatusBadge(job.status)}
              </div>
              <ActionDropdown job={job} />
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4 text-purple-600" />
                <span>{job.applicationCount} applications</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>{formatDate(job.datePosted)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {jobs.length === 0 && !loading && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No jobs found
          </h3>
          <p className="text-gray-500">
            Get started by creating your first job posting.
          </p>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total > pagination.limit && (
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={!pagination.hasPrev}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={!pagination.hasNext}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default JobsTable;
