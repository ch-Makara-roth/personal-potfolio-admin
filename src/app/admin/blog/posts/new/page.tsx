"use client";
import { AppLayout } from '@/components/layout';
import { AuthGuard } from '@/components/providers/AuthGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useState, useMemo } from 'react';
import { useCreateBlogPost } from '@/hooks/api';
import type { BlogPostStatus } from '@/types/api';
import { useRouter } from 'next/navigation';

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function AdminCreateBlogPostPage() {
  const router = useRouter();
  const createMutation = useCreateBlogPost();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState<BlogPostStatus>('DRAFT');
  const [tagsInput, setTagsInput] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const autoSlug = useMemo(() => slugify(title), [title]);
  const tags = useMemo(
    () =>
      tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    [tagsInput]
  );

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Title is required';
    if (!content.trim()) e.content = 'Content is required';
    if (tags.length < 1 || tags.length > 10)
      e.tags = 'Provide between 1 and 10 tags';
    if (metaTitle && metaTitle.length > 60)
      e.metaTitle = 'Meta title must be at most 60 characters';
    if (metaDescription && metaDescription.length > 160)
      e.metaDescription = 'Meta description must be at most 160 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    const payload = {
      title: title.trim(),
      content: content.trim(),
      excerpt: excerpt.trim() || undefined,
      slug: (slug.trim() || autoSlug) || undefined,
      status,
      tags,
      imageUrl: imageUrl.trim() || undefined,
      metaTitle: metaTitle.trim() || undefined,
      metaDescription: metaDescription.trim() || undefined,
    };
    createMutation.mutate(payload, {
      onSuccess: (res) => {
        const item = (res as any)?.data;
        const key = item?.slug || item?.id;
        if (key) router.push(`/admin/blog/posts/${key}`);
        else router.push('/admin/blog/posts');
      },
    });
  };

  return (
    <AppLayout>
      <AuthGuard />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">New Blog Post</h1>
          <Button
            variant="secondary"
            onClick={() => router.push('/admin/blog/posts')}
          >
            Back
          </Button>
        </div>
        <form onSubmit={onSubmit} aria-live="polite" className="space-y-6">
          <Card className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="title">
                Title
              </label>
              <input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                placeholder="Enter a compelling title"
              />
              {errors.title && (
                <p className="text-sm text-red-600 mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="content">
                Content
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                placeholder="Write your full blog content..."
              />
              {errors.content && (
                <p className="text-sm text-red-600 mt-1">{errors.content}</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="excerpt">
                  Excerpt
                </label>
                <textarea
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                  placeholder="A short summary for listings"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="slug">
                  Slug
                </label>
                <input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                  placeholder={autoSlug || 'auto-generated from title'}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="status">
                  Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as BlogPostStatus)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="tags">
                  Tags (comma-separated)
                </label>
                <input
                  id="tags"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                  placeholder="e.g. tech, web, react"
                />
                {errors.tags && (
                  <p className="text-sm text-red-600 mt-1">{errors.tags}</p>
                )}
                {!!tags.length && (
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="imageUrl">
                  Cover Image URL
                </label>
                <input
                  id="imageUrl"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                  placeholder="https://image.url"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="metaTitle">
                  SEO Title (max 60 chars)
                </label>
                <input
                  id="metaTitle"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                />
                {errors.metaTitle && (
                  <p className="text-sm text-red-600 mt-1">{errors.metaTitle}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="metaDescription">
                SEO Description (max 160 chars)
              </label>
              <textarea
                id="metaDescription"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
              />
              {errors.metaDescription && (
                <p className="text-sm text-red-600 mt-1">{errors.metaDescription}</p>
              )}
            </div>
          </Card>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Post'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/admin/blog/posts')}
            >
              Back
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}