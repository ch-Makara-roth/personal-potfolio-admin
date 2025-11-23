'use client';
import { AppLayout } from '@/components/layout';
import { AuthGuard } from '@/components/providers/AuthGuard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useAdminBlogPost, useUpdateBlogPost } from '@/hooks/api';
import { useUploadImage } from '@/hooks/api/useUploads';
import type { BlogPostStatus } from '@/types/api';
import { useRouter } from 'next/navigation';
import ImageUploadDialog from '@/components/ui/ImageUploadDialog';
import MarkdownEditor from '@/components/MarkdownEditor';

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function AdminEditBlogPostPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { data: post, isLoading, isError, error } = useAdminBlogPost(params.id);
  const updateMutation = useUpdateBlogPost();
  const { mutateAsync: uploadImage, isPending: uploadPending } =
    useUploadImage();

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

  // Image upload state
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploading, setUploading] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (post?.data) {
      const p = post.data;
      setTitle(p.title || '');
      setContent(p.content || '');
      setExcerpt(p.excerpt || '');
      setSlug(p.slug || '');
      setStatus(p.status || 'DRAFT');
      setTagsList(p.tags || []);
      setImageUrl(p.imageUrl || '');
      setMetaTitle(p.metaTitle || '');
      setMetaDescription(p.metaDescription || '');
    }
  }, [post]);

  const sanitizeImageUrl = (s: string) =>
    String(s || '')
      .replace(/[`]/g, '')
      .replace(/\)$/g, '')
      .trim();
  const previewUrl = useMemo(() => sanitizeImageUrl(imageUrl), [imageUrl]);
  const ALLOWED_TYPES = useMemo(
    () => [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
      'image/jpg',
    ],
    []
  );
  const MAX_SIZE = 5 * 1024 * 1024;
  const MIN_WIDTH = 640;
  const MIN_HEIGHT = 360;
  const TARGET_WIDTH = 1280;
  const TARGET_HEIGHT = 720;

  const readImageDataUrl = (f: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(f);
    });

  const getDimensions = (src: string) =>
    new Promise<{ w: number; h: number }>((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => reject(new Error('Failed to read image'));
      img.src = src;
    });

  const cropToAspect = async (src: string) => {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new window.Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Failed to load image'));
      el.src = src;
    });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    const targetRatio = TARGET_WIDTH / TARGET_HEIGHT;
    const ratio = img.naturalWidth / img.naturalHeight;
    let sx = 0;
    let sy = 0;
    let sw = img.naturalWidth;
    let sh = img.naturalHeight;
    if (ratio > targetRatio) {
      const newW = img.naturalHeight * targetRatio;
      sx = (img.naturalWidth - newW) / 2;
      sw = newW;
    } else if (ratio < targetRatio) {
      const newH = img.naturalWidth / targetRatio;
      sy = (img.naturalHeight - newH) / 2;
      sh = newH;
    }
    canvas.width = TARGET_WIDTH;
    canvas.height = TARGET_HEIGHT;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);
    return new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92)
    );
  };

  const onUploadCover = async (file: File) => {
    try {
      setUploadError(null);
      setUploadStatus('');
      if (!ALLOWED_TYPES.includes(file.type)) {
        setUploadError('Unsupported file type');
        return;
      }
      if (file.size > MAX_SIZE) {
        setUploadError('Max size 5MB');
        return;
      }
      setUploading(true);
      setUploadStatus('Reading image…');
      const dataUrl = await readImageDataUrl(file);
      setCoverPreview(dataUrl);
      const { w, h } = await getDimensions(dataUrl);
      if (w < MIN_WIDTH || h < MIN_HEIGHT) {
        setUploadError('Image too small');
        setUploading(false);
        return;
      }
      setUploadStatus('Cropping…');
      const blob = await cropToAspect(dataUrl);
      const processed = blob
        ? new File(
            [blob],
            (file.name || 'cover').replace(/\.[^.]+$/, '') + '.jpg',
            {
              type: 'image/jpeg',
            }
          )
        : file;
      setUploadStatus('Uploading…');
      const resp = await uploadImage({
        file: processed,
        uploader: 'blog-cover',
      });
      const image = (resp as any)?.data?.image ?? (resp as any)?.data;
      const url = sanitizeImageUrl(image?.secureUrl || image?.url || '');
      if (!url) {
        setUploadError('Upload failed');
        setUploading(false);
        return;
      }
      setImageUrl(url);
      setUploadStatus('Uploaded');
    } catch (e: any) {
      setUploadError(e?.message || 'Upload error');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadStatus(''), 800);
    }
  };

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
      { id: params.id, data: payload },
      {
        onSuccess: () => {
          router.push('/admin/blog/posts');
        },
      }
    );
  };

  const isDirty = useMemo(() => {
    const p = post?.data;
    if (!p) return false; // If post hasn't loaded, it's not dirty
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
  }, [
    post,
    title,
    content,
    excerpt,
    slug,
    status,
    tags,
    imageUrl,
    metaTitle,
    metaDescription,
  ]);

  if (isLoading) {
    return (
      <AppLayout>
        <AuthGuard />
        <div className="p-8 text-center">Loading post...</div>
      </AppLayout>
    );
  }

  if (isError) {
    return (
      <AppLayout>
        <AuthGuard />
        <div className="p-8 text-center text-red-600">
          Error loading post: {error?.message}
        </div>
      </AppLayout>
    );
  }

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
          </div>
        </div>
        <form onSubmit={onSubmit} aria-live="polite" className="space-y-6">
          {Object.keys(errors).length > 0 && (
            <Card className="p-4">
              <div
                role="alert"
                aria-live="assertive"
                className="text-sm text-red-700"
              >
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
              <Input
                label="Title"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                error={errors.title}
                placeholder="Enter a compelling title"
              />

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  htmlFor="content"
                >
                  Content (Markdown)
                </label>

                <div className="grid gap-4">
                  <div>
                    <MarkdownEditor
                      storageKey={`blog-post-${params.id}`}
                      value={content}
                      onChange={(md) => setContent(md)}
                    />
                  </div>
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
                    placeholder="A short summary for listings"
                  />
                </div>
                <div>
                  <Input
                    label="Slug"
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder={autoSlug || 'auto-generated from title'}
                  />
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>Auto: {autoSlug || 'n/a'}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSlug(autoSlug || '')}
                    >
                      Use auto
                    </Button>
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
                          const val = (
                            e.target as HTMLInputElement
                          ).value.trim();
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
                        const el = document.getElementById(
                          'tags'
                        ) as HTMLInputElement | null;
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
                      <span
                        key={t}
                        className="inline-flex items-center gap-2 px-2 py-1 text-xs rounded-full bg-purple-50 text-purple-700 border border-purple-200"
                      >
                        {t}
                        <button
                          type="button"
                          title="Remove"
                          onClick={() =>
                            setTagsList((prev) => prev.filter((x) => x !== t))
                          }
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
                  <Input
                    label="Cover Image URL"
                    id="imageUrl"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://image.url"
                  />
                  <button
                    type="button"
                    aria-label="Upload cover image"
                    className="mt-2 relative rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-4 w-full flex flex-col items-center justify-center gap-2 text-center cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-colors"
                    onClick={() => setDialogOpen(true)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const f = e.dataTransfer.files?.[0] || null;
                      if (f) onUploadCover(f);
                    }}
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Drag & Drop or Click to Upload
                    </span>
                    <span className="text-xs text-gray-500">
                      JPG, PNG, WEBP, GIF, SVG — up to 5MB
                    </span>
                    <span className="text-xs text-gray-500">
                      Min {MIN_WIDTH}×{MIN_HEIGHT}
                    </span>
                  </button>
                  {(uploading || uploadPending) && (
                    <div
                      className="mt-2 text-xs text-gray-600"
                      role="status"
                      aria-live="polite"
                    >
                      {uploadStatus || 'Uploading…'}
                    </div>
                  )}
                  {uploadError && (
                    <div
                      className="mt-2 text-xs text-red-600"
                      role="alert"
                      aria-live="polite"
                    >
                      {uploadError}
                    </div>
                  )}
                  {previewUrl && (
                    <div className="mt-2 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                      <div className="relative aspect-video bg-gray-50 dark:bg-gray-800">
                        <Image
                          src={previewUrl}
                          alt="Cover preview"
                          fill
                          sizes="100vw"
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}
                  {coverPreview && (
                    <div className="mt-2 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                      <div className="relative aspect-video bg-gray-50 dark:bg-gray-800">
                        <Image
                          src={coverPreview}
                          alt="Selected preview"
                          fill
                          sizes="100vw"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <Input
                    label="SEO Title (max 60 chars)"
                    id="metaTitle"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    error={errors.metaTitle}
                    helperText={`${metaTitle.length}/60`}
                  />
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
                <div className="mt-1 text-xs text-gray-500">
                  {metaDescription.length}/160
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              loading={updateMutation.isPending}
              loadingText="Saving..."
            >
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
      </div>
      <ImageUploadDialog
        open={dialogOpen}
        maxSizeMB={5}
        loading={uploading || uploadPending}
        error={uploadError || undefined}
        statusText={uploadStatus}
        onDone={(file) => {
          if (!file) return;
          onUploadCover(file);
          setDialogOpen(false);
        }}
        onClose={() => {
          setDialogOpen(false);
          setUploadError(null);
          setUploadStatus('');
          setUploading(false);
        }}
      />
    </AppLayout>
  );
}
