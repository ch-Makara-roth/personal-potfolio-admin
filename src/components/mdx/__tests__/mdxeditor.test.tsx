import React, { createRef, useImperativeHandle, forwardRef } from 'react';
import { render, screen, act } from '@testing-library/react';
import { InitializedMDXEditor } from '..';
import type { MDXEditorMethods } from '@mdxeditor/editor';

jest.mock('@mdxeditor/editor', () => {
  const React = require('react');
  const { useState, useEffect, useImperativeHandle, forwardRef } = React;
  const MDXEditor = forwardRef((props: any, ref: any) => {
    const [md, setMd] = useState(props.markdown || '');
    useEffect(() => {
      setMd(props.markdown || '');
    }, [props.markdown]);
    useImperativeHandle(ref, () => ({
      setMarkdown: (next: string) => {
        setMd(next);
        props.onChange?.(next);
      },
      getMarkdown: async () => md,
    }));
    return React.createElement('div', {}, md);
  });
  MDXEditor.displayName = 'MDXEditor';
  return {
    MDXEditor,
    headingsPlugin: () => null,
    listsPlugin: () => null,
    quotePlugin: () => null,
    thematicBreakPlugin: () => null,
    markdownShortcutPlugin: () => null,
    linkPlugin: () => null,
    imagePlugin: () => null,
    tablePlugin: () => null,
    codeBlockPlugin: () => null,
    codeMirrorPlugin: () => null,
    jsxPlugin: () => null,
    toolbarPlugin: () => null,
    Button: (p: any) => React.createElement('button', p, p.children),
    usePublisher: () => () => {},
    insertJsx$: {},
    GenericJsxEditor: () => null,
  };
});

describe('MDXEditor integration', () => {
  test('renders markdown content', () => {
    render(
      <InitializedMDXEditor editorRef={null} markdown={'# Hello world'} />
    );
    expect(screen.getByText('# Hello world')).toBeInTheDocument();
  });

  test('supports setMarkdown and getMarkdown via ref', async () => {
    const ref = createRef<MDXEditorMethods>();
    const onChange = jest.fn();
    render(
      <InitializedMDXEditor
        editorRef={ref}
        markdown={'# First'}
        onChange={onChange}
      />
    );
    await act(async () => {
      ref.current?.setMarkdown('# Second');
    });
    expect(screen.getByText('# Second')).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith('# Second');
    const value = await ref.current?.getMarkdown();
    expect(value).toContain('Second');
  });
});
