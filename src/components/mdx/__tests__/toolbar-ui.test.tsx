import React from 'react';
import { render, screen } from '@testing-library/react';
import Toolbar from '../Toolbar';

jest.mock('@mdxeditor/editor', () => {
  const React = require('react');
  const { forwardRef, useImperativeHandle } = React;
  const MDXEditor = forwardRef((props: any, ref: any) => {
    useImperativeHandle(ref, () => ({
      getMarkdown: () => '',
      setMarkdown: () => {},
      insertMarkdown: () => {},
      focus: () => {},
    }));
    return React.createElement('div', {});
  });
  MDXEditor.displayName = 'MDXEditor';
  const Dummy = (p: any) =>
    React.createElement(
      'button',
      { title: p?.title || 'button' },
      p?.children || null
    );
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
    UndoRedo: Dummy,
    BoldItalicUnderlineToggles: Dummy,
    CodeToggle: Dummy,
    HighlightToggle: Dummy,
    StrikeThroughSupSubToggles: Dummy,
    ListsToggle: Dummy,
    BlockTypeSelect: Dummy,
    CreateLink: Dummy,
    InsertTable: Dummy,
    InsertImage: Dummy,
    InsertCodeBlock: Dummy,
    Separator: () => React.createElement('span', { role: 'separator' }),
    Button: Dummy,
    usePublisher: () => () => {},
    insertJsx$: {},
    GenericJsxEditor: () => null,
  };
});

describe('Toolbar UI', () => {
  test('renders grouped toolbar controls with separators', () => {
    render(<Toolbar />);
    expect(screen.getAllByRole('separator').length).toBeGreaterThanOrEqual(3);
  });
});
