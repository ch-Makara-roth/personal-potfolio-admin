'use client';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Button } from './Button';
import {
  useFocusTrap,
  useKeyboardNavigation,
  useId,
} from '@/hooks/useAccessibility';

export type ConfirmDeleteDialogProps = {
  open: boolean;
  title?: string;
  message?: string;
  confirmText?: string; // text the user must type to enable delete
  entityName?: string; // optional, shows what will be deleted
  loading?: boolean; // disable actions while in progress
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDeleteDialog({
  open,
  title = 'Confirm Delete',
  message = 'This action cannot be undone. Please type the confirmation text to proceed.',
  confirmText = 'delete',
  entityName,
  loading,
  onConfirm,
  onClose,
}: ConfirmDeleteDialogProps) {
  const [input, setInput] = useState('');
  const containerRef = useFocusTrap<HTMLDivElement>(open);
  const headingId = useId('confirm-delete-heading');
  const descId = useId('confirm-delete-desc');

  const isMatch = useMemo(
    () => input.trim().toLowerCase() === confirmText.toLowerCase(),
    [input, confirmText]
  );

  // Reset input when closed/opened
  useEffect(() => {
    if (open) setInput('');
  }, [open]);

  const handleKey = useCallback(
    (key: string) => {
      if (!open) return;
      if (key === 'Escape') onClose();
    },
    [open, onClose]
  );

  useKeyboardNavigation(handleKey);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={descId}
        className="relative modal w-full max-w-md rounded-lg bg-white dark:bg-gray-900 shadow-lg border border-gray-200 dark:border-gray-800 p-6"
      >
        <h2 id={headingId} className="text-lg font-semibold text-red-600">
          {title}
        </h2>
        <p
          id={descId}
          className="mt-2 text-sm text-gray-700 dark:text-gray-300"
        >
          {message}
        </p>
        {entityName && (
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
            Item: <span className="font-medium">{entityName}</span>
          </p>
        )}

        <div className="mt-4">
          <label
            htmlFor="confirm-delete-input"
            className="block text-sm font-medium mb-1"
          >
            Type &quot;{confirmText}&quot; to confirm
          </label>
          <input
            id="confirm-delete-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
            placeholder={confirmText}
          />
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={!isMatch || !!loading}
          >
            {loading ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDeleteDialog;
