'use client';
import React, { useEffect } from 'react';
import NextImage from 'next/image';
import { Button } from './Button';
import {
  useFocusTrap,
  useKeyboardNavigation,
  useId,
} from '@/hooks/useAccessibility';

export type ImageUploadDialogProps = {
  open: boolean;
  accept?: string;
  loading?: boolean;
  error?: string;
  statusText?: string;
  onDone: (file: File | null) => void;
  onClose: () => void;
  maxSizeMB?: number;
};

export function ImageUploadDialog({
  open,
  accept = 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/jpg',
  loading,
  error,
  statusText,
  onDone,
  onClose,
  maxSizeMB = 5,
}: ImageUploadDialogProps) {
  const containerRef = useFocusTrap<HTMLDivElement>(open);
  const headingId = useId('image-upload-heading');
  const descId = useId('image-upload-desc');
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string>('');
  const [croppedPreview, setCroppedPreview] = React.useState<string>('');
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [processing, setProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState<number>(0);

  const allowed = React.useMemo(
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

  const validateFile = (f: File) => {
    if (!allowed.includes(f.type)) return 'Unsupported file type';
    if (f.size > maxSizeMB * 1024 * 1024) return `Max size ${maxSizeMB}MB`;
    return null;
  };

  const handleSelectFile = (f: File) => {
    const err = validateFile(f);
    if (err) {
      setLocalError(err);
      setFile(null);
      setPreview('');
      setCroppedPreview('');
      return;
    }
    setLocalError(null);
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result || '');
      setPreview(url);
      // generate cropped preview synchronously when possible
      createCroppedPreview(url).then((dataUrl) => setCroppedPreview(dataUrl));
    };
    reader.readAsDataURL(f);
  };

  const createCroppedPreview = async (src: string, size = 256) => {
    return new Promise<string>((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve('');
        const minSide = Math.min(img.naturalWidth, img.naturalHeight);
        const sx = (img.naturalWidth - minSide) / 2;
        const sy = (img.naturalHeight - minSide) / 2;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };
      img.onerror = () => resolve('');
      img.src = src;
    });
  };

  const processAndSubmit = async (f: File) => {
    try {
      setProcessing(true);
      setProgress(10);
      const reader = new FileReader();
      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(f);
      });
      setProgress(40);
      const blob: Blob = await new Promise((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Canvas not supported'));
          const target = 512;
          const minSide = Math.min(img.naturalWidth, img.naturalHeight);
          const sx = (img.naturalWidth - minSide) / 2;
          const sy = (img.naturalHeight - minSide) / 2;
          canvas.width = target;
          canvas.height = target;
          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, target, target);
          setCroppedPreview(canvas.toDataURL('image/jpeg', 0.92));
          canvas.toBlob(
            (b) => {
              if (!b) return reject(new Error('Failed to create blob'));
              resolve(b);
            },
            'image/jpeg',
            0.92
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = dataUrl;
      });
      setProgress(70);
      const filename = (f.name || 'avatar').replace(/\.[^.]+$/, '') + '.jpg';
      const croppedFile = new File([blob], filename, { type: 'image/jpeg' });
      setProgress(100);
      onDone(croppedFile);
    } catch (err: any) {
      setLocalError(err?.message || 'Failed to process image');
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  useEffect(() => {
    if (!open) {
      setFile(null);
      setPreview('');
      setLocalError(null);
    }
  }, [open]);

  const handleKey = (key: string) => {
    if (!open) return;
    if (key === 'Escape') onClose();
  };
  useKeyboardNavigation(handleKey);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={descId}
        className="relative modal w-full max-w-md rounded-lg bg-white dark:bg-gray-900 shadow-lg border border-gray-200 dark:border-gray-800 p-6"
      >
        <h2 id={headingId} className="text-lg font-semibold">
          Image Uploader
        </h2>
        <p
          id={descId}
          className="mt-2 text-sm text-gray-700 dark:text-gray-300"
        >
          Drag and drop or click to select a photo. Allowed: JPG, PNG, WEBP,
          GIF, SVG. Max 2MB. We will automatically crop to a square and resize
          for a crisp profile picture.
        </p>

        <div className="mt-4 space-y-3">
          <div
            role="group"
            aria-labelledby={headingId}
            aria-describedby={descId}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setLocalError(null);
              const dropped = e.dataTransfer.files?.[0] || null;
              if (dropped) handleSelectFile(dropped);
            }}
            className="relative rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-4 flex flex-col items-center justify-center gap-2 text-center cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            onClick={() => {
              const el = document.getElementById(
                'image-upload-input'
              ) as HTMLInputElement | null;
              el?.click();
            }}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                const el = document.getElementById(
                  'image-upload-input'
                ) as HTMLInputElement | null;
                el?.click();
              }
            }}
          >
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Drag & Drop</strong> or <strong>Click to Select</strong>
            </div>
            <div className="text-xs text-gray-500">
              JPG, PNG, WEBP, GIF, SVG — up to {maxSizeMB}MB
            </div>
            <input
              id="image-upload-input"
              type="file"
              accept={accept}
              aria-label="Select image"
              data-testid="image-input"
              onChange={(e) => {
                setLocalError(null);
                const f = e.target.files?.[0] || null;
                if (f) handleSelectFile(f);
              }}
              className="sr-only"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative h-32 w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30 flex items-center justify-center overflow-hidden">
              {preview ? (
                <NextImage
                  src={preview}
                  alt="Original preview"
                  fill
                  sizes="100vw"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <span className="text-xs text-gray-500">No image selected</span>
              )}
            </div>
            <div className="relative h-32 w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30 flex items-center justify-center overflow-hidden">
              {croppedPreview ? (
                <NextImage
                  src={croppedPreview}
                  alt="Cropped preview"
                  fill
                  sizes="100vw"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <span className="text-xs text-gray-500">Cropped preview</span>
              )}
            </div>
          </div>

          {(localError || error) && (
            <div
              className="text-xs text-red-600"
              role="alert"
              aria-live="polite"
            >
              {localError || error}
            </div>
          )}
          {(processing || statusText) && (
            <div className="space-y-1">
              <div className="w-full h-1 rounded bg-gray-200 dark:bg-gray-800 overflow-hidden">
                <div
                  style={{ width: `${Math.min(progress, 100)}%` }}
                  className="h-1 bg-yellow-400 transition-all"
                />
              </div>
              <div
                className="text-xs text-gray-600"
                role="status"
                aria-live="polite"
              >
                {statusText || (processing ? 'Processing image…' : '')}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (!file) return;
              processAndSubmit(file);
            }}
            loading={!!loading}
            loadingText="Uploading…"
            disabled={!!loading || !file}
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ImageUploadDialog;
