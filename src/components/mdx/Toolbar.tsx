'use client';
import React from 'react';
import {
  UndoRedo,
  BoldItalicUnderlineToggles,
  CodeToggle,
  HighlightToggle,
  StrikeThroughSupSubToggles,
  ListsToggle,
  BlockTypeSelect,
  CreateLink,
  InsertTable,
  InsertImage,
  InsertCodeBlock,
  Separator,
} from '@mdxeditor/editor';
export default function Toolbar() {
  return (
    <div className="flex items-center gap-1 w-full">
      <div className="flex items-center gap-1">
        <UndoRedo />
      </div>
      <Separator />
      <div className="flex items-center gap-1">
        <BoldItalicUnderlineToggles />
        <CodeToggle />
        <HighlightToggle />
        <StrikeThroughSupSubToggles />
      </div>
      <Separator />
      <div className="flex items-center gap-1">
        <ListsToggle />
        <BlockTypeSelect />
      </div>
      <Separator />
      <div className="flex items-center gap-1">
        <CreateLink />
        <InsertTable />
        <InsertImage />
        <InsertCodeBlock />
      </div>
    </div>
  );
}
