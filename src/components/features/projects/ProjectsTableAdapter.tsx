import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import Link from 'next/link';
import { Edit, Trash2, Eye } from 'lucide-react';
import type { Project } from '@/types/api';

export interface ProjectsTableProps {
  projects: Project[];
  loading?: boolean;
  className?: string;
  onEdit?: (projectId: string) => void;
  onDelete?: (projectId: string) => void;
  canManage?: (project: Project) => boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null;
  onPageChange?: (page: number) => void;
}

const statusVariant = (status: Project['status']) => {
  switch (status) {
    case 'PUBLISHED':
      return 'success' as const;
    case 'DRAFT':
      return 'warning' as const;
    case 'ARCHIVED':
    default:
      return 'secondary' as const;
  }
};

export const ProjectsTable: React.FC<ProjectsTableProps> = ({
  projects,
  loading = false,
  className,
  onEdit,
  onDelete,
  canManage,
  pagination,
  onPageChange,
}) => {
  const columns: Array<DataTableColumn<Project>> = [
    {
      key: 'title',
      label: 'Title',
      align: 'left',
      render: (p) => (
        <div className="flex items-center gap-2">
          {p.featured && (
            <Badge variant="success" size="sm">
              Featured
            </Badge>
          )}
          <span>{p.title}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      width: 'w-36',
      render: (p) => (
        <Badge variant={statusVariant(p.status)} size="sm">
          {p.status}
        </Badge>
      ),
    },
    {
      key: 'technologies',
      label: 'Technologies',
      align: 'left',
      render: (p) => (
        <div className="flex flex-wrap gap-1">
          {(p.technologies || []).map((tech) => (
            <span
              key={tech}
              className="px-2 py-0.5 text-xs rounded-full bg-purple-50 text-purple-700 border border-purple-200"
            >
              {tech}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      align: 'center',
      width: 'w-28',
      render: (p) => {
        const allowed = canManage ? !!canManage(p) : true;
        return (
          <div className="flex items-center justify-center gap-3">
            <Link
              href={`/projects/${p.id}`}
              aria-label="View project"
              title="View"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              <Eye className="w-5 h-5" />
            </Link>
            <button
              type="button"
              aria-label="Delete project"
              title="Delete"
              onClick={() => allowed && onDelete?.(p.id)}
              disabled={!allowed}
              className={
                allowed
                  ? 'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                  : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
              }
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              type="button"
              aria-label="Edit project"
              title="Edit"
              onClick={() => allowed && onEdit?.(p.id)}
              disabled={!allowed}
              className={
                allowed
                  ? 'text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400'
                  : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
              }
            >
              <Edit className="w-5 h-5" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <DataTable<Project>
      rows={projects}
      columns={columns}
      getRowId={(p) => p.id}
      loading={loading}
      className={className}
      pagination={pagination || null}
      onPageChange={onPageChange}
      emptyMessage="No projects found."
    />
  );
};

export default ProjectsTable;
