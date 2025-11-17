'use client';
import { AppLayout } from '@/components/layout';
import { AuthGuard } from '@/components/providers/AuthGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';
import { Badge } from '@/components/ui/Badge';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  useAdminBlogPost,
  useDeleteBlogPost,
  useAdminComments,
  useUpdateComment,
  useDeleteComment,
} from '@/hooks/api';
import MdxContent from '@/components/features/MdxContent';
import ConfirmDeleteDialog from '@/components/ui/ConfirmDeleteDialog';

export default function AdminBlogPostDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id: key } = params; // can be id or slug
  const router = useRouter();
  const [showPostDeleteConfirm, setShowPostDeleteConfirm] = useState(false);
  const [showCommentDeleteConfirm, setShowCommentDeleteConfirm] =
    useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(
    null
  );
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key);
  const { data, isLoading, isError } = useAdminBlogPost(key);
  const post = (data as any)?.data;
  const deletePost = useDeleteBlogPost();
  const effectivePostId = isUuid ? key : post?.id;
  const { data: commentsData, isLoading: commentsLoading } = useAdminComments(
    { postId: effectivePostId, limit: 50 },
    { enabled: Boolean(effectivePostId) }
  );
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();
  const comments = (commentsData as any)?.data ?? [];

  const onDeletePost = () => {
    if (!post?.id) return;
    setShowPostDeleteConfirm(true);
  };

  const onConfirmDeletePost = () => {
    if (!post?.id) return;
    deletePost.mutate(post.id, {
      onSuccess: () => {
        setShowPostDeleteConfirm(false);
        router.push('/admin/blog/posts');
      },
    });
  };

  const onUpdateCommentStatus = (commentId: string, status: string) => {
    updateComment.mutate({ id: commentId, data: { status } as any });
  };

  const onDeleteComment = (commentId: string) => {
    setSelectedCommentId(commentId);
    setShowCommentDeleteConfirm(true);
  };

  const onConfirmDeleteComment = () => {
    if (!selectedCommentId) return;
    deleteComment.mutate(selectedCommentId, {
      onSuccess: () => {
        setShowCommentDeleteConfirm(false);
        setSelectedCommentId(null);
      },
    });
  };

  return (
    <AppLayout>
      <AuthGuard />
      <div className="space-y-6">
        {/* Post delete confirmation dialog */}
        <ConfirmDeleteDialog
          open={showPostDeleteConfirm}
          title="Delete Blog Post"
          message="This action cannot be undone. Please type 'delete' to permanently remove this post and its related data."
          entityName={post?.title}
          loading={deletePost.isPending}
          onConfirm={onConfirmDeletePost}
          onClose={() => setShowPostDeleteConfirm(false)}
        />
        {/* Comment delete confirmation dialog */}
        <ConfirmDeleteDialog
          open={showCommentDeleteConfirm}
          title="Delete Comment"
          message="This action cannot be undone. Please type 'delete' to permanently remove this comment."
          entityName={
            comments.find((c: any) => c.id === selectedCommentId)?.content
          }
          loading={deleteComment.isPending}
          onConfirm={onConfirmDeleteComment}
          onClose={() => {
            setShowCommentDeleteConfirm(false);
            setSelectedCommentId(null);
          }}
        />
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Post Details</h1>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => router.push('/admin/blog/posts')}
            >
              Back
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                router.push(
                  `/admin/blog/posts/${post?.slug || post?.id || key}/edit`
                )
              }
            >
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={onDeletePost}
              disabled={deletePost.isPending}
            >
              Delete
            </Button>
          </div>
        </div>

        {isLoading ? (
          <Card className="p-6">Loading...</Card>
        ) : isError || !post ? (
          <Card className="p-6 text-red-600">Failed to load post</Card>
        ) : (
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">{post.title}</h2>
              <Badge variant="secondary">{post.status}</Badge>
            </div>
            {post.slug && <p className="text-sm text-gray-500">/{post.slug}</p>}
            {post.imageUrl && (
              <div className="relative w-full h-64">
                <Image
                  src={post.imageUrl}
                  alt={post.title}
                  fill
                  unoptimized
                  sizes="100vw"
                  className="object-cover rounded-lg"
                />
              </div>
            )}
            <div className="prose dark:prose-invert max-w-none">
              <MdxContent source={post.content} />
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
              <span>
                Reading: {post.readingTime ? `${post.readingTime} min` : '-'}
              </span>
              <span>👍 {post.likes ?? 0}</span>
              <span>👁️ {post.views ?? 0}</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2">Tags</h3>
              <div className="flex gap-2 flex-wrap">
                {(post.tags || []).map((t: string) => (
                  <Badge key={t} variant="secondary">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
              <p>Created: {post.createdAt ?? '-'}</p>
              <p>Updated: {post.updatedAt ?? '-'}</p>
              <p>Published: {post.publishedAt ?? '-'}</p>
              <p>Author: {post.authorId ?? '-'}</p>
            </div>
          </Card>
        )}

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Comments</h2>
          </div>
          {commentsLoading ? (
            <div>Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="text-gray-500">No comments</div>
          ) : (
            <div className="overflow-x-auto">
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
                  {comments.map((c: any) => (
                    <tr
                      key={c.id}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      <td className="p-3">{c.authorName}</td>
                      <td className="p-3">{c.authorEmail}</td>
                      <td className="p-3 max-w-md truncate" title={c.content}>
                        {c.content}
                      </td>
                      <td className="p-3">
                        <select
                          value={c.status}
                          onChange={(e) =>
                            onUpdateCommentStatus(c.id, e.target.value)
                          }
                          className="px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="APPROVED">Approved</option>
                          <option value="REJECTED">Rejected</option>
                          <option value="SPAM">Spam</option>
                        </select>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onDeleteComment(c.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
