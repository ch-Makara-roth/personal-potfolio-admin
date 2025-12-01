'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the preview component to handle ESM dependencies (remark-gfm)
const MarkdownPreview = dynamic(() => import('./MarkdownPreview'), {
  ssr: false,
  loading: () => <div className="p-4 text-gray-500">Loading preview...</div>,
});

type Props = {
  value: string;
  onChange: (v: string) => void;
  storageKey?: string;
  className?: string;
};

export default function MarkdownEditor({
  value,
  onChange,
  storageKey = 'md-editor',
  className,
}: Props) {
  const [isPreview, setIsPreview] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved && saved !== value) onChange(saved);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    const id = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, value);
        setLastSaved(new Date().toISOString());
      } catch {}
    }, 1200);
    return () => clearTimeout(id);
  }, [value, storageKey]);

  function insertAtCursor(before = '', after = '', placeholder = '') {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart || 0;
    const end = ta.selectionEnd || 0;
    const selected = value.slice(start, end) || placeholder;
    const next =
      value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      const pos = start + before.length + selected.length + after.length;
      ta.focus();
      ta.setSelectionRange(pos, pos);
    });
  }

  function handleToolbar(action: string) {
    switch (action) {
      case 'bold':
        insertAtCursor('**', '**', 'bold text');
        break;
      case 'italic':
        insertAtCursor('*', '*', 'italic');
        break;
      case 'h1':
        insertAtCursor('# ', '', 'Heading 1');
        break;
      case 'h2':
        insertAtCursor('## ', '', 'Heading 2');
        break;
      case 'code':
        insertAtCursor('\n```\n', '\n```\n', 'code');
        break;
      case 'ul':
        insertAtCursor('- ', '\n', 'List item');
        break;
      case 'ol':
        insertAtCursor('1. ', '\n', 'List item');
        break;
      case 'link':
        insertAtCursor('[', '](https://)', 'text');
        break;
      case 'image':
        insertAtCursor('![](', ')', 'https://');
        break;
    }
  }

  function exportMarkdown() {
    const blob = new Blob([value || ''], {
      type: 'text/markdown;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (storageKey || 'document') + '.md';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(value || '');
    } catch {}
  }

  const counts = useMemo(() => {
    const text = value || '';
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    return { words, chars };
  }, [value]);

  return (
    <div className={className || ''}>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <button
          type="button"
          className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          onClick={() => handleToolbar('bold')}
        >
          B
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors italic"
          onClick={() => handleToolbar('italic')}
        >
          I
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          onClick={() => handleToolbar('h1')}
        >
          H1
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          onClick={() => handleToolbar('h2')}
        >
          H2
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          onClick={() => handleToolbar('ul')}
        >
          • List
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          onClick={() => handleToolbar('ol')}
        >
          1. List
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          onClick={() => handleToolbar('code')}
        >
          Code
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          onClick={() => handleToolbar('link')}
        >
          Link
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          onClick={() => handleToolbar('image')}
        >
          Image
        </button>
        <span className="ml-auto text-xs text-gray-500">
          {counts.words} words • {counts.chars} chars
          {lastSaved ? ` • saved ${lastSaved}` : ''}
        </span>
      </div>
      <div className="grid gap-4">
        {!isPreview ? (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={16}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 font-mono text-sm"
          />
        ) : (
          <div className="prose dark:prose-invert max-w-none p-3 rounded-lg border border-gray-200 dark:border-gray-700 min-h-[300px]">
            <MarkdownPreview value={value || ''} />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          className="px-3 py-1 rounded border"
          onClick={() => setIsPreview((p) => !p)}
        >
          {isPreview ? 'Edit' : 'Preview'}
        </button>
        <button
          type="button"
          className="px-3 py-1 rounded border"
          onClick={copyToClipboard}
        >
          Copy
        </button>
        <button
          type="button"
          className="px-3 py-1 rounded border"
          onClick={exportMarkdown}
        >
          Export .md
        </button>
      </div>
    </div>
  );
}
