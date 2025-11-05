'use client';
import { AppLayout } from '@/components/layout';
import { AuthGuard } from '@/components/providers/AuthGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { useState } from 'react';
import { useAdminContacts, useContactActions } from '@/hooks/api';

export default function AdminContactPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const { data, isLoading, isError } = useAdminContacts({
    page: 1,
    limit: 20,
    search: search || undefined,
    status: (status as any) || undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const { markRead, markReplied, archive } = useContactActions();

  return (
    <AppLayout>
      <AuthGuard />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Contact Messages</h1>
          <Link
            href="/admin/contact/stats"
            className="text-blue-600 hover:underline"
          >
            View Stats
          </Link>
        </div>

        <Card className="p-4">
          <div className="flex gap-3 flex-wrap">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search messages..."
              className="w-full md:w-64 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
            >
              <option value="">All Status</option>
              <option value="UNREAD">Unread</option>
              <option value="READ">Read</option>
              <option value="REPLIED">Replied</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </Card>

        <Card className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6 text-gray-500">Loading...</div>
          ) : isError ? (
            <div className="p-6 text-red-600">Failed to load messages</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200 dark:border-gray-800">
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.data?.map((m: any) => (
                  <tr
                    key={m.id}
                    className="border-b border-gray-100 dark:border-gray-800"
                  >
                    <td className="p-3">
                      <Link
                        href={`/admin/contact/${m.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {m.name}
                      </Link>
                    </td>
                    <td className="p-3 text-gray-600">{m.email}</td>
                    <td className="p-3 max-w-lg truncate" title={m.subject}>
                      {m.subject}
                    </td>
                    <td className="p-3">
                      <Badge variant="secondary">{m.status}</Badge>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => markRead.mutate(m.id)}
                        >
                          Mark Read
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => markReplied.mutate({ id: m.id })}
                        >
                          Mark Replied
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => archive.mutate(m.id)}
                        >
                          Archive
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
