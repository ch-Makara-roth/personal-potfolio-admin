'use client';
import { AppLayout } from '@/components/layout';
import { AuthGuard } from '@/components/providers/AuthGuard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAdminBlogPost, useUpdateBlogPost } from '@/hooks/api';
import type { BlogPostStatus } from '@/types/api';
import { useRouter } from 'next/navigation';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';

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
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let timer: any;
    async function render() {
      try {
        setError(null);
        const [{ evaluate }, remarkGfm] = await Promise.all([
          import('@mdx-js/mdx'),
          import('remark-gfm').then((m) => m.default || m),
        ]);
        const mod = await evaluate(source || '', {
          ...mdxRuntime,
          remarkPlugins: [remarkGfm as any],
        } as any);
        if (!cancelled) {
          setComp(() => (mod as any).default || null);
          setIsLoaded(true);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || 'Failed to render MDX');
          setComp(() => null);
        }
      }
    }
    timer = setTimeout(render, 350);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [source]);
  if (error) {
    return <div className="text-red-600">{error}</div>;
  }
  const Content = Comp;
  return Content ? <Content /> : (
    <div className="text-gray-500">{isLoaded ? 'No content' : 'Start typing to preview…'}</div>
  );
}

export default function AdminEditBlogPostPage({
  params,
}: {
  params: { id: string };
}) {
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
  const [tagsList, setTagsList] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewOpen, setPreviewOpen] = useState(true);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const p = (data as any)?.data;
    if (!p) return;
    setTitle(p.title ?? '');
    setContent(p.content ?? '');
    setExcerpt(p.excerpt ?? '');
    setSlug(p.slug ?? '');
    setStatus(p.status ?? 'DRAFT');
    setTagsList(Array.isArray(p.tags) ? p.tags : []);
    setImageUrl(p.imageUrl ?? '');
    setMetaTitle(p.metaTitle ?? '');
    setMetaDescription(p.metaDescription ?? '');
  }, [data]);

  const autoSlug = useMemo(() => slugify(title), [title]);
  const tags = useMemo(() => tagsList, [tagsList]);

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
      slug: slug.trim() || autoSlug || undefined,
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

  const isDirty = useMemo(() => {
    const p = (data as any)?.data || {};
    return (
      (p.title ?? '') !== title ||
      (p.content ?? '') !== content ||
      (p.excerpt ?? '') !== excerpt ||
      (p.slug ?? '') !== slug ||
      (p.status ?? 'DRAFT') !== status ||
      JSON.stringify(p.tags ?? []) !== JSON.stringify(tags) ||
      (p.imageUrl ?? '') !== imageUrl ||
      (p.metaTitle ?? '') !== metaTitle ||
      (p.metaDescription ?? '') !== metaDescription
    );
  }, [data, title, content, excerpt, slug, status, tags, imageUrl, metaTitle, metaDescription]);

  const insertToken = (before: string, after = '') => {
    const el = editorRef.current;
    if (!el) return;
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const val = content;
    const selected = val.slice(start, end);
    const next = val.slice(0, start) + before + selected + after + val.slice(end);
    setContent(next);
    setTimeout(() => {
      el.focus();
      el.selectionStart = start + before.length;
      el.selectionEnd = start + before.length + selected.length;
    }, 0);
  };

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [content]);

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
              variant="outline"
              onClick={() =>
                router.push(
                  `/admin/blog/posts/${post?.slug || post?.id || key}`
                )
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
            {Object.keys(errors).length > 0 && (
              <Card className="p-4">
                <div role="alert" aria-live="assertive" className="text-sm text-red-700">
                  Please fix the following issues:
                  <ul className="list-disc ml-5 mt-1">
                    {Object.entries(errors).map(([k, v]) => (
                      <li key={k}>{v}</li>
                    ))}
                  </ul>
                </div>
              </Card>
            )}
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle>Content</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  htmlFor="title"
                >
                  Title
                </label>
                <input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  aria-invalid={Boolean(errors.title)}
                  aria-describedby={errors.title ? 'error-title' : undefined}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                />
                {errors.title && (
                  <p id="error-title" className="text-sm text-red-600 mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  htmlFor="content"
                >
                  Content (MDX)
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <Button type="button" variant="secondary" size="sm" onClick={() => insertToken('**', '**')}>Bold</Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => insertToken('*', '*')}>Italic</Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => insertToken('`', '`')}>Code</Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => insertToken('[', '](https://)')}>Link</Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => insertToken('- ', '')}>List</Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => setPreviewOpen((p) => !p)}>{previewOpen ? 'Hide Preview' : 'Show Preview'}</Button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <textarea
                      id="content"
                      ref={editorRef}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={16}
                      placeholder="Write MDX here..."
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 font-mono"
                    />
                  </div>
                  {previewOpen && (
                    <div className="md:sticky md:top-24">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        Live Preview
                      </div>
                      <div className="prose dark:prose-invert max-w-none px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                        <MdxLivePreview source={content} />
                      </div>
                    </div>
                  )}
                </div>
                {errors.content && (
                  <p className="text-sm text-red-600 mt-1">{errors.content}</p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    htmlFor="excerpt"
                  >
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
                  <label
                    className="block text-sm font-medium mb-1"
                    htmlFor="slug"
                  >
                    Slug
                  </label>
                  <input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                    placeholder={autoSlug || 'auto-generated from title'}
                  />
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>Auto: {autoSlug || 'n/a'}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setSlug(autoSlug || '')}>Use auto</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(slug || autoSlug || '')}>Copy</Button>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    htmlFor="status"
                  >
                    Status
                  </label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as BlogPostStatus)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    htmlFor="tags"
                  >
                    Tags
                  </label>
                  <div className="mt-1 flex gap-2">
                    <input
                      id="tags"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (!val) return;
                          if (tagsList.includes(val)) return;
                          setTagsList((prev) => [...prev, val]);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                      placeholder="Add tag and press Enter"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        const el = document.getElementById('tags') as HTMLInputElement | null;
                        const v = el?.value.trim() || '';
                        if (!v) return;
                        if (tagsList.includes(v)) return;
                        setTagsList((prev) => [...prev, v]);
                        if (el) el.value = '';
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tagsList.map((t) => (
                      <span key={t} className="inline-flex items-center gap-2 px-2 py-1 text-xs rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                        {t}
                        <button
                          type="button"
                          title="Remove"
                          onClick={() => setTagsList((prev) => prev.filter((x) => x !== t))}
                          className="text-purple-600 hover:text-purple-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  {errors.tags && (
                    <p className="text-sm text-red-600 mt-1">{errors.tags}</p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    htmlFor="imageUrl"
                  >
                    Cover Image URL
                  </label>
                  <input
                    id="imageUrl"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                  />
                  {imageUrl.trim() && (
                    <div className="mt-2 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                      <div className="aspect-video bg-gray-50 dark:bg-gray-800">
                        <img
                          src={imageUrl}
                          alt="Cover preview"
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    htmlFor="metaTitle"
                  >
                    SEO Title (max 60 chars)
                  </label>
                  <input
                    id="metaTitle"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                  />
                  {errors.metaTitle && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.metaTitle}
                    </p>
                  )}
                  <div className="mt-1 text-xs text-gray-500">{metaTitle.length}/60</div>
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  htmlFor="metaDescription"
                >
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
                  <p className="text-sm text-red-600 mt-1">
                    {errors.metaDescription}
                  </p>
                )}
                <div className="mt-1 text-xs text-gray-500">{metaDescription.length}/160</div>
              </div>
              </CardContent>
            </Card>
            <div className="flex items-center gap-3">
              <Button type="submit" loading={updateMutation.isPending} loadingText="Saving...">
                Save Changes
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  if (!isDirty || window.confirm('Discard unsaved changes?')) {
                    router.push('/admin/blog/posts');
                  }
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </AppLayout>
  );
}
