'use client';
import { AppLayout } from '@/components/layout';
import { AuthGuard } from '@/components/providers/AuthGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useState } from 'react';
import Link from 'next/link';
import { useAdminBlogPosts, useDeleteBlogPost } from '@/hooks/api';
import ConfirmDeleteDialog from '@/components/ui/ConfirmDeleteDialog';

export default function AdminBlogPostsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedPost, setSelectedPost] = useState<{
    id: string;
    title?: string;
  } | null>(null);
  const { data, isLoading, isError } = useAdminBlogPosts({
    page: 1,
    limit: 20,
    search: search || undefined,
    status: (status as any) || undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const del = useDeleteBlogPost();

  const onDelete = (id: string, title?: string) => {
    setSelectedPost({ id, title });
    setShowDeleteConfirm(true);
  };

  const onConfirmDelete = () => {
    if (!selectedPost?.id) return;
    del.mutate(selectedPost.id, {
      onSuccess: () => {
        setShowDeleteConfirm(false);
        setSelectedPost(null);
      },
    });
  };

  return (
    <AppLayout>
      <AuthGuard />
      <div className="space-y-6">
        <ConfirmDeleteDialog
          open={showDeleteConfirm}
          title="Delete Blog Post"
          message="This action cannot be undone. Please type 'delete' to permanently remove this post."
          entityName={selectedPost?.title}
          loading={del.isPending}
          onConfirm={onConfirmDelete}
          onClose={() => {
            setShowDeleteConfirm(false);
            setSelectedPost(null);
          }}
        />
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Blog Posts</h1>
          <Link href="/admin/blog/posts/new">
            <Button>Create Blog</Button>
          </Link>
        </div>

        <Card className="p-4">
          <div className="flex gap-3 flex-wrap">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title..."
              className="w-full md:w-64 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
            >
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </Card>

        <Card className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6 text-gray-500">Loading...</div>
          ) : isError ? (
            <div className="p-6 text-red-600">Failed to load posts</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200 dark:border-gray-800">
                  <th className="p-3">Title</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Tags</th>
                  <th className="p-3">Reading</th>
                  <th className="p-3">Metrics</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.data?.map((p: any) => (
                  <tr
                    key={p.id}
                    className="border-b border-gray-100 dark:border-gray-800"
                  >
                    <td className="p-3">
                      <Link
                        href={`/admin/blog/posts/${p.slug || p.id}`}
                        className="font-medium hover:underline"
                      >
                        {p.title}
                      </Link>
                      <div className="text-xs text-gray-500">{p.slug}</div>
                    </td>
                    <td className="p-3">
                      <Badge variant="secondary">{p.status}</Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2 flex-wrap">
                        {(p.tags || []).slice(0, 3).map((t: string) => (
                          <Badge key={t} variant="secondary">
                            {t}
                          </Badge>
                        ))}
                        {(p.tags || []).length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{(p.tags || []).length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      {p.readingTime ? `${p.readingTime} min` : '-'}
                    </td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">
                      <div className="flex gap-4">
                        <span>👍 {p.likes ?? 0}</span>
                        <span>👁️ {p.views ?? 0}</span>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <Link href={`/admin/blog/posts/${p.slug || p.id}/edit`}>
                          <Button size="sm" variant="secondary">
                            Edit
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onDelete(p.id, p.title)}
                          disabled={del.isPending}
                        >
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
