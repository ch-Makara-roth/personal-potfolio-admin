"use client";
import { AppLayout } from '@/components/layout';
import { AuthGuard } from '@/components/providers/AuthGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useEffect, useMemo, useState } from 'react';
import { useAdminBlogPost, useUpdateBlogPost } from '@/hooks/api';
import type { BlogPostStatus } from '@/types/api';
import { useRouter } from 'next/navigation';
import { evaluate } from '@mdx-js/mdx';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import remarkGfm from 'remark-gfm';

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const mdxRuntime = { jsx, jsxs, Fragment } as const;

function MdxLivePreview({ source }: { source: string }) {
  const [Comp, setComp] = useState<React.ComponentType<any> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function render() {
      try {
        setError(null);
        const mod = await evaluate(source || '', {
          ...mdxRuntime,
          remarkPlugins: [remarkGfm],
        } as any);
        if (!cancelled) {
          setComp(() => (mod as any).default || null);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || 'Failed to render MDX');
          setComp(() => null);
        }
      }
    }
    render();
    return () => {
      cancelled = true;
    };
  }, [source]);

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }
  const Content = Comp;
  return Content ? (
    // Provide components override here if needed: <Content components={...} />
    <Content />
  ) : (
    <div className="text-gray-500">Start typing to preview…</div>
  );
}

export default function AdminEditBlogPostPage({ params }: { params: { id: string } }) {
  const { id: key } = params; // can be id or slug
  const router = useRouter();
  const { data, isLoading, isError } = useAdminBlogPost(key);
  const post = (data as any)?.data;
  const updateMutation = useUpdateBlogPost();

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

  useEffect(() => {
    const p = (data as any)?.data;
    if (!p) return;
    setTitle(p.title ?? '');
    setContent(p.content ?? '');
    setExcerpt(p.excerpt ?? '');
    setSlug(p.slug ?? '');
    setStatus(p.status ?? 'DRAFT');
    setTagsInput((p.tags ?? []).join(', '));
    setImageUrl(p.imageUrl ?? '');
    setMetaTitle(p.metaTitle ?? '');
    setMetaDescription(p.metaDescription ?? '');
  }, [data]);

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
    updateMutation.mutate(
      { id: (data as any)?.data?.id || key, data: payload },
      {
        onSuccess: () => {
          const item = (data as any)?.data;
          const nextKey = item?.slug || item?.id || key;
          router.push(`/admin/blog/posts/${nextKey}`);
        },
      }
    );
  };

  return (
    <AppLayout>
      <AuthGuard />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Edit Blog Post</h1>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/admin/blog/posts')}
            >
              Back
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                router.push(`/admin/blog/posts/${post?.slug || post?.id || key}`)
              }
            >
              View
            </Button>
          </div>
        </div>
        {isLoading ? (
          <Card className="p-6">Loading...</Card>
        ) : isError ? (
          <Card className="p-6 text-red-600">Failed to load post</Card>
        ) : (
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
                />
                {errors.title && (
                  <p className="text-sm text-red-600 mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="content">
                  Content (MDX)
                </label>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={16}
                      placeholder="Write MDX here..."
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                    />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Live Preview</div>
                    <div className="prose dark:prose-invert max-w-none px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                      <MdxLivePreview source={content} />
                    </div>
                  </div>
                </div>
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
                  />
                  {errors.tags && (
                    <p className="text-sm text-red-600 mt-1">{errors.tags}</p>
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
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => router.push('/admin/blog/posts')}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </AppLayout>
  );
}