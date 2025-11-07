import React from 'react';
import { FormBuilder, type FormField } from '@/components/ui/FormBuilder';
import { cn } from '@/utils/cn';
import type {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectStatus,
} from '@/types/api';

export interface ProjectsFormProps {
  initial?: Partial<Project> | null;
  submitting?: boolean;
  onSubmit: (data: CreateProjectRequest | UpdateProjectRequest) => void;
  onCancel?: () => void;
  className?: string;
}

type ProjectFormValues = {
  title: string;
  description: string;
  technologies: string[];
  content?: string;
  slug?: string;
  status: ProjectStatus;
  featured: boolean;
  githubUrl?: string;
  liveUrl?: string;
  imageUrl?: string;
  images: string[];
  metaTitle?: string;
  metaDescription?: string;
};

export const ProjectsForm: React.FC<ProjectsFormProps> = ({
  initial,
  submitting = false,
  onSubmit,
  onCancel,
  className,
}) => {
  const init: ProjectFormValues = {
    title: initial?.title || '',
    description: initial?.description || '',
    technologies: initial?.technologies || [],
    content: initial?.content || '',
    slug: initial?.slug || '',
    status: (initial?.status as ProjectStatus) || 'DRAFT',
    featured: Boolean(initial?.featured),
    githubUrl: initial?.githubUrl || '',
    liveUrl: initial?.liveUrl || '',
    imageUrl: initial?.imageUrl || '',
    images: initial?.images || [],
    metaTitle: initial?.metaTitle || '',
    metaDescription: initial?.metaDescription || '',
  };

  const fields: Array<FormField<ProjectFormValues>> = [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      section: 'Basics',
      required: true,
      placeholder: 'Project title',
      helpText: 'A clear, descriptive title of your project.',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      section: 'Basics',
      rows: 3,
      required: true,
      placeholder: 'Short description',
      helpText: 'A concise summary that appears in listings and previews.',
    },
    {
      name: 'technologies',
      label: 'Technologies',
      type: 'chip-list',
      section: 'Basics',
      required: true,
      minItems: 1,
      addLabel: 'Add',
      helpText: 'Add the main technologies used (e.g., React, Next.js).',
    },
    {
      name: 'content',
      label: 'Content',
      type: 'textarea',
      section: 'Content',
      rows: 6,
      placeholder: 'Detailed content',
      helpText: 'Detailed overview or notes about the project.',
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      section: 'Settings',
      options: [
        { label: 'DRAFT', value: 'DRAFT' },
        { label: 'PUBLISHED', value: 'PUBLISHED' },
        { label: 'ARCHIVED', value: 'ARCHIVED' },
      ],
      helpText: 'Controls visibility and lifecycle of the project.',
    },
    {
      name: 'slug',
      label: 'Slug',
      type: 'text',
      section: 'Settings',
      placeholder: 'project-slug',
      helpText:
        'Optional. If blank, the server may generate one automatically.',
    },
    {
      name: 'featured',
      label: 'Featured',
      type: 'checkbox',
      section: 'Settings',
    },
    {
      name: 'githubUrl',
      label: 'GitHub URL',
      type: 'url',
      section: 'Links',
      placeholder: 'https://github.com/repo',
      helpText: 'Link to the repository, if applicable.',
    },
    {
      name: 'liveUrl',
      label: 'Live URL',
      type: 'url',
      section: 'Links',
      placeholder: 'https://demo.com',
      helpText: 'Link to a live demo or deployed site.',
    },
    {
      name: 'imageUrl',
      label: 'Primary Image URL',
      type: 'url',
      section: 'Media',
      placeholder: 'https://image.jpg',
      helpText: 'Used as the cover image for cards and detail headers.',
    },
    {
      name: 'images',
      label: 'Additional Images',
      type: 'list',
      section: 'Media',
      itemType: 'url',
      itemPlaceholder: 'https://img1.jpg',
      addLabel: 'Add image',
      helpText: 'Optional gallery images to showcase your project.',
    },
    {
      name: 'metaTitle',
      label: 'Meta Title',
      type: 'text',
      section: 'SEO',
      maxLength: 60,
      helpText: 'SEO title. Aim for 50–60 characters.',
    },
    {
      name: 'metaDescription',
      label: 'Meta Description',
      type: 'textarea',
      section: 'SEO',
      rows: 3,
      maxLength: 160,
      helpText: 'SEO description. Aim for 140–160 characters.',
    },
  ];

  const handleSubmit = (values: ProjectFormValues) => {
    const payload: CreateProjectRequest | UpdateProjectRequest = {
      title: values.title.trim(),
      description: values.description.trim(),
      technologies: values.technologies,
      content: values.content?.trim() || undefined,
      slug: values.slug?.trim() || undefined,
      status: values.status,
      featured: values.featured,
      githubUrl: values.githubUrl?.trim() || undefined,
      liveUrl: values.liveUrl?.trim() || undefined,
      imageUrl: values.imageUrl?.trim() || undefined,
      images: values.images?.filter(Boolean) || undefined,
      metaTitle: values.metaTitle?.trim() || undefined,
      metaDescription: values.metaDescription?.trim() || undefined,
    };
    onSubmit(payload);
  };

  return (
    <FormBuilder<ProjectFormValues>
      fields={fields}
      initialValues={init}
      submitting={submitting}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      className={cn('w-full max-w-none mx-0', className)}
      submitLabel={initial?.id ? 'Save Changes' : 'Create Project'}
    />
  );
};

export default ProjectsForm;
