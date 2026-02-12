'use client';

import React, { useState, Suspense, lazy } from 'react';
import { AppLayout } from '@/components/layout';
import { FileText, FolderGit2, MessageSquare } from 'lucide-react';
import { StatsCard } from '@/components/ui';
import { StatsCardSkeleton } from '@/components/ui/Skeleton';

export default function DashboardPage() {
  // Mock data for portfolio stats
  const stats = [
    {
      title: 'Total Projects',
      value: 12,
      icon: FolderGit2,
      variant: 'applications' as const,
      subtitle: 'Active projects',
      trend: { data: [5, 8, 10, 12] },
    },
    {
      title: 'Blog Posts',
      value: 24,
      icon: FileText,
      variant: 'interviews' as const,
      subtitle: 'Published posts',
      trend: { data: [15, 18, 20, 24] },
    },
    {
      title: 'Messages',
      value: 156,
      icon: MessageSquare,
      variant: 'hired' as const,
      subtitle: 'Total inquiries',
      trend: { data: [100, 120, 140, 156] },
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome to your CONSULT hiring analytics dashboard
          </p>
        </div>

        {/* Portfolio Statistics */}
        <section aria-label="Dashboard statistics">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, index) => (
              <StatsCard
                key={index}
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                variant={stat.variant}
                subtitle={stat.subtitle}
                trend={stat.trend}
              />
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
