'use client';
import React, { useEffect, useState } from 'react';
import { evaluate } from '@mdx-js/mdx';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import remarkGfm from 'remark-gfm';

const mdxRuntime = { jsx, jsxs, Fragment } as const;

export type MdxContentProps = {
  source?: string | null;
  // You can pass MDX component overrides if needed
  components?: Record<string, React.ComponentType<any>>;
  emptyPlaceholder?: React.ReactNode;
};

/**
 * Client-side MDX renderer using @mdx-js/mdx evaluate.
 * Safe by default (no raw HTML). Supports GitHub Flavored Markdown via remark-gfm.
 */
export function MdxContent({
  source,
  components,
  emptyPlaceholder,
}: MdxContentProps) {
  const [Comp, setComp] = useState<React.ComponentType<any> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function render() {
      const input = (source ?? '').toString();
      if (!input.trim()) {
        setComp(() => null);
        setError(null);
        return;
      }
      try {
        setError(null);
        const mod = await evaluate(input, {
          ...mdxRuntime,
          remarkPlugins: [remarkGfm],
        } as any);
        if (!cancelled) {
          setComp(() => (mod as any).default || null);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || 'Failed to render content');
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
  if (!Comp) {
    return (
      <div className="text-gray-500">{emptyPlaceholder ?? 'No content'}</div>
    );
  }
  const Content = Comp;
  return <Content components={components as any} />;
}

export default MdxContent;
