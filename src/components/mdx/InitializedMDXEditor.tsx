'use client';
import type { ForwardedRef } from 'react';
import { useEffect, useState } from 'react';
import {
  MDXEditor,
  type MDXEditorProps,
  type MDXEditorMethods,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  imagePlugin,
  tablePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  jsxPlugin,
  toolbarPlugin,
  Button,
  usePublisher,
  insertJsx$,
  GenericJsxEditor,
  type JsxComponentDescriptor,
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import { Badge } from '@/components/ui/Badge';
import Callout from './components/Callout';
import Toolbar from './Toolbar';

const jsxComponentDescriptors: JsxComponentDescriptor[] = [
  {
    name: 'Badge',
    kind: 'text',
    source: '@/components/ui/Badge',
    props: [{ name: 'variant', type: 'string' }],
    hasChildren: true,
    Editor: GenericJsxEditor,
  },
  {
    name: 'Callout',
    kind: 'flow',
    source: '@/components/mdx/components/Callout',
    props: [
      { name: 'type', type: 'string' },
      { name: 'title', type: 'string' },
    ],
    hasChildren: true,
    Editor: GenericJsxEditor,
  },
];

function InsertBadge() {
  const insertJsx = usePublisher(insertJsx$);
  return (
    <Button
      onClick={() =>
        insertJsx({
          name: 'Badge',
          kind: 'text',
          props: { variant: 'default' },
        })
      }
    >
      Badge
    </Button>
  );
}

function InsertCallout() {
  const insertJsx = usePublisher(insertJsx$);
  return (
    <Button
      onClick={() =>
        insertJsx({
          name: 'Callout',
          kind: 'flow',
          props: { type: 'info' },
        })
      }
    >
      Callout
    </Button>
  );
}

export default function InitializedMDXEditor({
  editorRef,
  ...props
}: { editorRef: ForwardedRef<MDXEditorMethods> | null } & MDXEditorProps) {
  const [full, setFull] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFull(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <div
      className={
        full
          ? 'fixed inset-0 z-[1000] bg-white dark:bg-gray-900 p-3 flex flex-col'
          : ''
      }
    >
      <MDXEditor
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          markdownShortcutPlugin(),
          linkPlugin(),
          imagePlugin(),
          tablePlugin(),
          codeBlockPlugin(),
          codeMirrorPlugin(),
          jsxPlugin({ jsxComponentDescriptors }),
          toolbarPlugin({
            toolbarContents: () => <Toolbar />,
            toolbarClassName:
              'rounded-xl bg-gray-50 border border-gray-200 px-2 py-1 flex items-center gap-1 overflow-x-auto min-w-screen h-auto',
          }),
        ]}
        {...{
          ...props,
          markdown:
            typeof props.markdown === 'string'
              ? props.markdown
                  .split('\n')
                  .filter((l) => !/^\s*(import|export)\b/.test(l))
                  .join('\n')
              : props.markdown,
        }}
        ref={editorRef}
      />
    </div>
  );
}
