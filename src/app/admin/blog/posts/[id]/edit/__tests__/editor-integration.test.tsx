import React from 'react';
import { render, screen } from '@testing-library/react';
import AdminEditBlogPostPage from '../page';

jest.mock('@/hooks/api', () => ({
  useAdminBlogPost: () => ({
    data: { data: { title: 'T', content: '# Hello', status: 'DRAFT' } },
    isLoading: false,
    isError: false,
  }),
  useUpdateBlogPost: () => ({ mutate: jest.fn(), isPending: false }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/admin/blog/posts/1/edit',
}));

jest.mock('@/hooks/api/useUploads', () => ({
  useUploadImage: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));

jest.mock('@/components/layout', () => ({
  AppLayout: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/providers/AuthGuard', () => ({
  AuthGuard: () => null,
}));

describe('Blog editor integration', () => {
  test('renders MarkdownEditor with initial content', () => {
    render(<AdminEditBlogPostPage params={{ id: '1' }} />);
    expect(screen.getByDisplayValue('# Hello')).toBeInTheDocument();
  });
});
