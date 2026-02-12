'use client';

import React from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ToastContainer } from '@/components/ui/Toast';
import { useProject } from '@/hooks/api/useProjects';

export default function ViewProjectPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || '';
  const { data: resp, isLoading } = useProject(id);
  const p = resp?.data || null;

  return (
    <AppLayout>
      <ToastContainer position="top-right" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Project Details
            </h1>
            <p className="text-gray-600">View project information</p>
          </div>
          <div className="flex gap-2">
            {p && (
              <Button
                variant="primary"
                onClick={() => router.push(`/projects/${p.id}/edit`)}
              >
                Edit
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => router.push('/projects')}
            >
              Back to Projects
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {p ? p.title : isLoading ? 'Loading…' : 'Not found'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="space-y-3">
                <div className="h-5 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            )}
            {!isLoading && p && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      p.status === 'PUBLISHED'
                        ? 'success'
                        : p.status === 'DRAFT'
                          ? 'warning'
                          : 'secondary'
                    }
                    size="sm"
                  >
                    {p.status}
                  </Badge>
                  {p.featured && (
                    <Badge variant="success" size="sm">
                      Featured
                    </Badge>
                  )}
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-2">Description</h2>
                  <p className="text-gray-700">{p.description}</p>
                </div>

                {p.content && (
                  <div>
                    <h2 className="text-lg font-semibold mb-2">Content</h2>
                    <div className="prose max-w-none">{p.content}</div>
                  </div>
                )}

                <div>
                  <h2 className="text-lg font-semibold mb-2">Technologies</h2>
                  <div className="flex flex-wrap gap-2">
                    {(p.technologies || []).map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-0.5 text-xs rounded-full bg-purple-50 text-purple-700 border border-purple-200"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {p.githubUrl && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        GitHub
                      </h3>
                      <a
                        href={p.githubUrl}
                        className="text-blue-600 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {p.githubUrl}
                      </a>
                    </div>
                  )}
                  {p.liveUrl && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Live URL
                      </h3>
                      <a
                        href={p.liveUrl}
                        className="text-blue-600 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {p.liveUrl}
                      </a>
                    </div>
                  )}
                </div>

                {(p.imageUrl || (p.images && p.images.length > 0)) && (
                  <div>
                    <h2 className="text-lg font-semibold mb-2">Images</h2>
                    <div className="flex flex-wrap gap-3">
                      {p.imageUrl && (
                        <Image
                          src={p.imageUrl}
                          alt={`${p.title} primary`}
                          width={192}
                          height={128}
                          unoptimized
                          className="w-48 h-32 object-cover rounded border"
                        />
                      )}
                      {(p.images || []).map((img, idx) => (
                        <Image
                          key={`${img}-${idx}`}
                          src={img}
                          alt={`${p.title} ${idx + 1}`}
                          width={192}
                          height={128}
                          unoptimized
                          className="w-48 h-32 object-cover rounded border"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
