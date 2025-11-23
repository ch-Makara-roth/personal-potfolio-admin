'use client';
import { ForwardRefEditor } from './ForwardRefEditor';
import type { MDXEditorProps, MDXEditorMethods } from '@mdxeditor/editor';
import { useRef, useImperativeHandle, forwardRef } from 'react';

export type CustomizedMDXEditorProps = MDXEditorProps & {
  initialMarkdown?: string;
};

export const CustomizedMDXEditor = forwardRef<
  MDXEditorMethods,
  CustomizedMDXEditorProps
>(function CustomizedMDXEditor({ initialMarkdown, ...props }, ref) {
  const innerRef = useRef<MDXEditorMethods>(null);
  useImperativeHandle(ref, () => innerRef.current as MDXEditorMethods, []);
  return (
    <ForwardRefEditor markdown={initialMarkdown} {...props} ref={innerRef} />
  );
});

CustomizedMDXEditor.displayName = 'CustomizedMDXEditor';

export default CustomizedMDXEditor;
