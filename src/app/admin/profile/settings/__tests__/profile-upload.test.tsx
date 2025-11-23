import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import Page from '@/app/admin/profile/settings/page';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return React.createElement('img', { ...props });
  },
}));

jest.mock('@/components/providers/AuthGuard', () => ({
  AuthGuard: () => null,
}));

const mockUpload = jest.fn();
const mockUpdateProfile = jest.fn();

jest.mock('@/hooks/api', () => {
  const original = jest.requireActual('@/hooks/api');
  return {
    __esModule: true,
    ...original,
    useProfile: () => ({
      data: {
        data: {
          id: 'user-1',
          email: 'u@example.com',
          username: 'user',
          avatar: '',
        },
        status: 'success',
        timestamp: new Date().toISOString(),
      },
      isLoading: false,
      isError: false,
    }),
    useUploadImage: () => ({
      mutateAsync: mockUpload,
      isPending: false,
    }),
    useUpdateProfile: () => ({
      mutateAsync: mockUpdateProfile,
      isPending: false,
    }),
    useChangePassword: () => ({ mutateAsync: jest.fn(), isPending: false }),
  };
});
describe('Profile image upload flow', () => {
  beforeEach(() => {
    mockUpload.mockReset();
    mockUpdateProfile.mockReset();
  });

  it('uploads image and saves avatar on profile', async () => {
    mockUpload.mockResolvedValue({
      data: {
        image: {
          externalId: 'ext-1',
          secureUrl: 'https://cdn.example.com/i.png',
        },
      },
      status: 'success',
      timestamp: new Date().toISOString(),
    });

    mockUpdateProfile.mockResolvedValue({
      data: { id: 'user-1', avatar: 'https://cdn.example.com/i.png' },
      status: 'success',
      timestamp: new Date().toISOString(),
    });
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    render(
      <QueryClientProvider client={client}>
        <Page />
      </QueryClientProvider>
    );

    const avatar = document.querySelector(
      '[role="button"].avatar-base'
    ) as HTMLElement;
    await userEvent.click(avatar);

    const input = screen.getByLabelText('Select image');
    const file = new File(['x'], 'ok.png', { type: 'image/png' });
    await userEvent.upload(input, file);

    const done = screen.getByRole('button', { name: 'Done' });
    await userEvent.click(done);

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalled();
    });

    expect(mockUpdateProfile).toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.queryByText('Uploading image…')).not.toBeInTheDocument();
    });
  });

  it('shows error when upload fails', async () => {
    mockUpload.mockRejectedValue({
      code: 'VALIDATION_ERROR',
      message: 'Invalid file',
    });

    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    render(
      <QueryClientProvider client={client}>
        <Page />
      </QueryClientProvider>
    );
    const avatar = document.querySelector(
      '[role="button"].avatar-base'
    ) as HTMLElement;
    await userEvent.click(avatar);

    const input = screen.getByLabelText('Select image');
    const file = new File(['x'], 'bad.png', { type: 'image/png' });
    await userEvent.upload(input, file);

    const done = screen.getByRole('button', { name: 'Done' });
    await userEvent.click(done);

    await waitFor(() => {
      expect(screen.getByText('Invalid file')).toBeInTheDocument();
    });
  });
});
