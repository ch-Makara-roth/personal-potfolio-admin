import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { MoreHorizontal } from 'lucide-react';

export type DataTableColumn<T> = {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  width?: string; // Tailwind width classes like 'w-32' or 'flex-1'
  render: (row: T) => React.ReactNode;
};

export type DataTableActionItem<T> = {
  key: string;
  label: string;
  onClick: (row: T) => void;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'destructive';
};

export interface DataTableProps<T> {
  rows: T[];
  columns: Array<DataTableColumn<T>>;
  getRowId: (row: T) => string;
  loading?: boolean;
  className?: string;
  actions?: {
    getItems: (row: T) => Array<DataTableActionItem<T>>;
    canManage?: (row: T) => boolean;
    direction?: 'up' | 'down' | 'auto';
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null;
  onPageChange?: (page: number) => void;
  emptyMessage?: string;
}

export function DataTable<T>({
  rows,
  columns,
  getRowId,
  loading = false,
  className,
  actions,
  pagination,
  onPageChange,
  emptyMessage = 'No records found.',
}: DataTableProps<T>) {
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const shouldOpenUp = () => {
    if (!actions || actions.direction === 'down') return false;
    if (actions.direction === 'up') return true;
    try {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return false;
      const spaceBelow = window.innerHeight - rect.bottom;
      return spaceBelow < 200; // basic heuristic
    } catch {
      return false;
    }
  };

  if (loading) {
    return (
      <Card className={cn('overflow-visible w-full', className)}>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex space-x-4">
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-48"></div>
                <div className="h-4 bg-gray-200 rounded w-8"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const renderActionsCell = (row: T) => {
    if (!actions) return null;
    const can = actions.canManage ? actions.canManage(row) : true;
    if (!can) return <span className="text-xs text-gray-400">No access</span>;
    const isOpen = activeRowId === getRowId(row);
    const items = actions.getItems(row);
    const up = shouldOpenUp();
    return (
      <div className="relative">
        <Button
          ref={buttonRef}
          variant="ghost"
          size="sm"
          onClick={() => setActiveRowId(isOpen ? null : getRowId(row))}
          className="h-8 w-8 p-0"
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
        {isOpen && (
          <>
            {/* overlay to capture outside clicks */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setActiveRowId(null)}
            />
            {typeof document !== 'undefined' && buttonRef.current ? (
              createPortal(
                (() => {
                  const rect = buttonRef.current!.getBoundingClientRect();
                  const baseClasses =
                    'z-50 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1';
                  const style: React.CSSProperties = {
                    position: 'fixed',
                    left: rect.right,
                    top: up ? rect.top : rect.bottom,
                    transform: `translate(-100%, ${up ? '-4px' : '4px'})`,
                  };
                  return (
                    <div style={style} className={cn(baseClasses)}>
                      {items.map((it) => {
                        const Icon = it.icon;
                        return (
                          <button
                            key={it.key}
                            onClick={() => {
                              setActiveRowId(null);
                              it.onClick(row);
                            }}
                            className={cn(
                              'w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors',
                              it.variant === 'destructive' &&
                                'text-red-600 hover:bg-red-50'
                            )}
                          >
                            {Icon && <Icon className="w-4 h-4" />}
                            {it.label}
                          </button>
                        );
                      })}
                    </div>
                  );
                })(),
                document.body
              )
            ) : (
              // Fallback (SSR) - keep relative absolute menu
              <div
                className={cn(
                  'absolute right-0 z-50 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1',
                  up ? 'bottom-full mb-1' : 'top-full mt-1'
                )}
              >
                {items.map((it) => {
                  const Icon = it.icon;
                  return (
                    <button
                      key={it.key}
                      onClick={() => {
                        setActiveRowId(null);
                        it.onClick(row);
                      }}
                      className={cn(
                        'w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors',
                        it.variant === 'destructive' &&
                          'text-red-600 hover:bg-red-50'
                      )}
                    >
                      {Icon && <Icon className="w-4 h-4" />}
                      {it.label}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <Card className={cn('overflow-visible w-full', className)}>
      {/* Desktop table */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider',
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right',
                      col.width
                    )}
                  >
                    {col.label}
                  </th>
                ))}
                {actions && (
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.map((row) => (
                <tr key={getRowId(row)} className="hover:bg-gray-50">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-3 text-sm',
                        col.align === 'center' && 'text-center',
                        col.align === 'right' && 'text-right'
                      )}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-sm text-center">
                      {renderActionsCell(row)}
                    </td>
                  )}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length + (actions ? 1 : 0)}
                    className="px-4 py-6 text-center text-sm text-gray-500"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {pagination && (
          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-gray-600">
              Page {pagination.page} of{' '}
              {Math.max(
                1,
                Math.ceil(pagination.total / Math.max(1, pagination.limit))
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={!pagination.hasPrev}
                onClick={() => onPageChange?.(Math.max(1, pagination.page - 1))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={!pagination.hasNext}
                onClick={() => onPageChange?.(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y">
        {rows.map((row) => (
          <div key={getRowId(row)} className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                {columns.map((col) => (
                  <div key={col.key}>
                    <div className="text-xs text-gray-500">{col.label}</div>
                    <div className="text-sm text-gray-900">
                      {col.render(row)}
                    </div>
                  </div>
                ))}
              </div>
              {actions && <div>{renderActionsCell(row)}</div>}
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="p-6 text-center text-sm text-gray-500">
            {emptyMessage}
          </div>
        )}
      </div>
    </Card>
  );
}

export default DataTable;
