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
import { Search } from 'lucide-react';

interface BlogPost {
  id: string;
  slug?: string;
  title: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  tags?: string[];
  readingTime?: number;
  likes?: number;
  views?: number;
}

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
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title..."
                aria-label="Search posts by title"
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all min-w-[150px]"
            >
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </Card>

        <Card className="overflow-hidden" padding="none">
          {isLoading ? (
            <div className="p-6 text-gray-500">Loading...</div>
          ) : isError ? (
            <div className="p-6 text-red-600">Failed to load posts</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                  <th className="p-4 font-medium text-gray-500 dark:text-gray-400">
                    Title
                  </th>
                  <th className="p-4 font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="p-4 font-medium text-gray-500 dark:text-gray-400">
                    Tags
                  </th>
                  <th className="p-4 font-medium text-gray-500 dark:text-gray-400">
                    Reading
                  </th>
                  <th className="p-4 font-medium text-gray-500 dark:text-gray-400">
                    Metrics
                  </th>
                  <th className="p-4 font-medium text-gray-500 dark:text-gray-400 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.data?.map((p: BlogPost) => (
                  <tr
                    key={p.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="p-4">
                      <Link
                        href={`/admin/blog/posts/${p.slug || p.id}`}
                        className="font-medium text-gray-900 dark:text-gray-100 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                      >
                        {p.title}
                      </Link>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {p.slug}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant="secondary"
                        className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                      >
                        {p.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 flex-wrap">
                        {(p.tags || []).slice(0, 3).map((t: string) => (
                          <Badge
                            key={t}
                            variant="outline"
                            className="border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                          >
                            {t}
                          </Badge>
                        ))}
                        {(p.tags || []).length > 3 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 self-center">
                            +{(p.tags || []).length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">
                      {p.readingTime ? `${p.readingTime} min` : '-'}
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">
                      <div className="flex gap-4">
                        <span title="Likes">👍 {p.likes ?? 0}</span>
                        <span title="Views">👁️ {p.views ?? 0}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <Link href={`/admin/blog/posts/${p.slug || p.id}/edit`}>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="hover:bg-gray-200 dark:hover:bg-gray-700"
                          >
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
