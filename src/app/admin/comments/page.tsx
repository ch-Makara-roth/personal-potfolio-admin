'use client';
import { AppLayout } from '@/components/layout';
import { AuthGuard } from '@/components/providers/AuthGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useState } from 'react';
import { useAdminComments } from '@/hooks/api';

export default function AdminCommentsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const { data, isLoading, isError } = useAdminComments({
    page: 1,
    limit: 20,
    search: search || undefined,
    status: (status as any) || undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  return (
    <AppLayout>
      <AuthGuard />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Comments</h1>
        </div>

        <Card className="p-4">
          <div className="flex gap-3 flex-wrap">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search comments..."
              className="w-full md:w-64 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="SPAM">Spam</option>
            </select>
          </div>
        </Card>

        <Card className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6 text-gray-500">Loading...</div>
          ) : isError ? (
            <div className="p-6 text-red-600">Failed to load comments</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200 dark:border-gray-800">
                  <th className="p-3">Author</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Content</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.data?.map((c: any) => (
                  <tr
                    key={c.id}
                    className="border-b border-gray-100 dark:border-gray-800"
                  >
                    <td className="p-3">{c.authorName}</td>
                    <td className="p-3 text-gray-600">{c.authorEmail}</td>
                    <td className="p-3 max-w-xl truncate" title={c.content}>
                      {c.content}
                    </td>
                    <td className="p-3">
                      <Badge variant="secondary">{c.status}</Badge>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="secondary">
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive">
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
