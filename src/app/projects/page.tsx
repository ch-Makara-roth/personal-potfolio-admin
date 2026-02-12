'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout';
import { ProjectsTable } from '@/components/features/projects';
import ConfirmDeleteDialog from '@/components/ui/ConfirmDeleteDialog';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { Search } from 'lucide-react';
import {
  useProjects,
  useMyProjects,
  useDeleteProject,
} from '@/hooks/api/useProjects';
import { useAuthStore } from '@/stores/auth-store';
import type { Project, ProjectQuery, ProjectStatus } from '@/types/api';

const statusOptions: (ProjectStatus | 'ALL')[] = [
  'ALL',
  'DRAFT',
  'PUBLISHED',
  'ARCHIVED',
];

export default function ProjectsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { success: showSuccess, error: showError } = useToast();

  // Filters and pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState<ProjectStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [technologiesInput, setTechnologiesInput] = useState('');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<ProjectQuery['sortBy']>('createdAt');
  const [sortOrder, setSortOrder] = useState<ProjectQuery['sortOrder']>('desc');

  const query: ProjectQuery = useMemo(() => {
    const techs = technologiesInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    return {
      page,
      limit,
      status: status === 'ALL' ? undefined : status,
      search: search || undefined,
      technologies: techs.length ? techs : undefined,
      featured: featuredOnly || undefined,
      sortBy: sortBy || undefined,
      sortOrder: sortOrder || undefined,
    };
  }, [
    page,
    limit,
    status,
    search,
    technologiesInput,
    featuredOnly,
    sortBy,
    sortOrder,
  ]);

  const { data: listResp, isLoading } = useProjects(query);
  const projects: Project[] = listResp?.data ?? [];

  // My Projects - a compact section
  const { data: myResp } = useMyProjects({
    page: 1,
    limit: 5,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });
  const myProjects: Project[] = myResp?.data ?? [];

  // Deletion dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const { mutateAsync: deleteProject, isPending: deleting } =
    useDeleteProject();

  const canManage = (project: Project) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return project.ownerId === user.id;
  };

  const handleEdit = (id: string) => {
    router.push(`/projects/${id}/edit`);
  };

  const handleDelete = (id: string) => {
    const target =
      projects.find((p) => p.id === id) ||
      myProjects.find((p) => p.id === id) ||
      null;
    setDeleteTarget(target);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    try {
      if (!deleteTarget?.id) return;
      await deleteProject(deleteTarget.id);
      showSuccess('Project deleted', `${deleteTarget.title} was removed.`);
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (e: any) {
      const msg = e?.message || 'Failed to delete project';
      showError('Delete failed', msg);
    }
  };

  const handleCreate = () => {
    router.push('/projects/new');
  };

  return (
    <AppLayout>
      {/* Toasts container */}
      <ToastContainer position="top-right" />

      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Projects
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your portfolio projects
            </p>
          </div>
          {user && (
            <Button onClick={handleCreate} variant="primary">
              + New Project
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Title or description"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Status
              </label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as ProjectStatus | 'ALL')
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              >
                {statusOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt === 'ALL' ? 'All' : opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Technologies (CSV)
              </label>
              <input
                type="text"
                value={technologiesInput}
                onChange={(e) => setTechnologiesInput(e.target.value)}
                placeholder="e.g. React, Next.js"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as ProjectQuery['sortBy'])
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              >
                <option value="createdAt">Created</option>
                <option value="updatedAt">Updated</option>
                <option value="title">Title</option>
                <option value="publishedAt">Published</option>
                <option value="featured">Featured</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Order
              </label>
              <select
                value={sortOrder}
                onChange={(e) =>
                  setSortOrder(e.target.value as ProjectQuery['sortOrder'])
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>

            <div className="md:col-span-2 lg:col-span-2 flex items-end justify-between pb-1">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featuredOnly}
                  onChange={(e) => setFeaturedOnly(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span>Featured only</span>
              </label>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Per page
                </label>
                <select
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value) || 10)}
                  className="px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  {[5, 10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Projects list */}
        <section aria-label="All projects">
          <ProjectsTable
            projects={projects}
            loading={isLoading}
            canManage={canManage}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPageChange={(p) => setPage(p)}
            pagination={null}
          />
        </section>

        {/* My Projects section removed */}

        {/* Delete dialog */}
        <ConfirmDeleteDialog
          open={deleteOpen}
          entityName={deleteTarget?.title}
          onConfirm={confirmDelete}
          onClose={() => setDeleteOpen(false)}
          loading={deleting}
          confirmText="delete"
        />
      </div>
    </AppLayout>
  );
}
