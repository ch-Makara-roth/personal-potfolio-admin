'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { ProjectsForm } from '@/components/features/projects';
import { useCreateProject } from '@/hooks/api/useProjects';
import type { CreateProjectRequest, UpdateProjectRequest } from '@/types/api';

export default function NewProjectPage() {
  const router = useRouter();
  const { success: showSuccess, error: showError } = useToast();
  const { mutate: createProject, isPending } = useCreateProject();

  const handleSubmit = (data: CreateProjectRequest | UpdateProjectRequest) => {
    // On the create page, ProjectsForm provides a create payload; cast for the mutation.
    createProject(data as CreateProjectRequest, {
      onSuccess: (resp) => {
        const created = resp?.data;
        showSuccess('Project created', `${created.title} has been created.`);
        // Navigate to edit page for further changes
        router.replace(`/projects/${created.id}/edit`);
      },
      onError: (e: any) => {
        const msg = e?.message || 'Failed to create project';
        showError('Create failed', msg);
      },
    });
  };

  const handleCancel = () => {
    router.push('/projects');
  };

  return (
    <AppLayout>
      <ToastContainer position="top-right" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">New Project</h1>
            <p className="text-gray-600">Create a new portfolio project</p>
          </div>
          <Button variant="secondary" onClick={handleCancel}>
            Back to Projects
          </Button>
        </div>

        <Card>
          <div className="p-6">
            <ProjectsForm
              initial={null}
              submitting={isPending}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
