'use client';
import React from 'react';

export type CalloutProps = {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children?: React.ReactNode;
};

const variants: Record<string, string> = {
  info: 'border-blue-300 bg-blue-50 text-blue-700',
  success: 'border-green-300 bg-green-50 text-green-700',
  warning: 'border-yellow-300 bg-yellow-50 text-yellow-700',
  error: 'border-red-300 bg-red-50 text-red-700',
};

export default function Callout({
  type = 'info',
  title,
  children,
}: CalloutProps) {
  const cls = variants[type] || variants.info;
  return (
    <div className={`border rounded-md p-3 ${cls}`}>
      {title && <div className="font-semibold mb-1">{title}</div>}
      {children}
    </div>
  );
}
