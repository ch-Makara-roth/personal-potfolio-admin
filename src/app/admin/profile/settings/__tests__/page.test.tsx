import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminProfileSettingsPage from '../page';

jest.mock('@/components/layout', () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock('@/components/providers/AuthGuard', () => ({
  AuthGuard: () => null,
}));

const mockUseProfile = jest.fn();
const mockUseUploadImage = jest.fn();
const mockUseUpdateProfile = jest.fn();
const mockUseChangePassword = jest.fn();

jest.mock('@/hooks/api', () => ({
  useProfile: () => mockUseProfile(),
  useUploadImage: () => mockUseUploadImage(),
  useUpdateProfile: () => mockUseUpdateProfile(),
  useChangePassword: () => mockUseChangePassword(),
}));

const createWrapper = (ui: React.ReactNode) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>
  );
};

beforeAll(() => {
  (global.URL as any).createObjectURL = jest.fn(() => 'blob:preview');
  (global.URL as any).revokeObjectURL = jest.fn();
});

describe('AdminProfileSettingsPage avatar upload', () => {
  test('uploads image and updates avatar', async () => {
    const uploadMutate = jest.fn().mockResolvedValue({
      data: {
        image: { externalId: 'ext123', secureUrl: 'https://cdn/img.png' },
      },
    });
    const updateMutate = jest.fn().mockResolvedValue({});
    mockUseProfile.mockReturnValue({
      data: { data: { id: 'u1', firstName: 'Ada', avatar: '' } },
      isLoading: false,
      isError: false,
    });
    mockUseUploadImage.mockReturnValue({
      mutateAsync: uploadMutate,
      isPending: false,
    });
    mockUseUpdateProfile.mockReturnValue({
      mutateAsync: updateMutate,
      isPending: false,
    });
    mockUseChangePassword.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    createWrapper(<AdminProfileSettingsPage />);
    const avatarButton = document.querySelector(
      '[role="button"].avatar-base'
    ) as HTMLElement;
    fireEvent.click(avatarButton);
    expect(
      screen.getByRole('dialog', { name: /image uploader/i })
    ).toBeInTheDocument();
    const input = screen.getByLabelText(/select image/i);
    const file = new File(['x'], 'avatar.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /done/i }));

    await waitFor(() => expect(uploadMutate).toHaveBeenCalled());
    expect(updateMutate).toHaveBeenCalled();

    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: /image uploader/i })
      ).not.toBeInTheDocument()
    );
  });
});
