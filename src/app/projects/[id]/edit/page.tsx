'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AppLayout } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { ProjectsForm } from '@/components/features/projects';
import { useProject, useUpdateProject } from '@/hooks/api/useProjects';
import type { UpdateProjectRequest } from '@/types/api';

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string) || '';
  const { success: showSuccess, error: showError } = useToast();
  const { data: resp, isLoading } = useProject(id);
  const project = resp?.data || null;
  const { mutateAsync: updateProject, isPending } = useUpdateProject();

  const handleSubmit = async (data: UpdateProjectRequest) => {
    try {
      await updateProject({ id, data });
      showSuccess('Project updated', 'Changes have been saved.');
      router.replace(`/projects/${id}`);
    } catch (e: any) {
      const msg = e?.message || 'Failed to update project';
      showError('Update failed', msg);
    }
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
            <h1 className="text-3xl font-bold text-gray-900">Edit Project</h1>
            <p className="text-gray-600">Update project details</p>
          </div>
          <Button variant="secondary" onClick={handleCancel}>
            Back to Projects
          </Button>
        </div>

        <ProjectsForm
          initial={project}
          submitting={isPending || isLoading}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          className="w-full max-w-none mx-0"
        />
      </div>
    </AppLayout>
  );
}
