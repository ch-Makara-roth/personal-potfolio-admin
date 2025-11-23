import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImageUploadDialog from '@/components/ui/ImageUploadDialog';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return React.createElement('img', { ...props });
  },
}));

describe('ImageUploadDialog', () => {
  it('validates file type and size', async () => {
    const onDone = jest.fn();
    const onClose = jest.fn();
    render(
      <ImageUploadDialog
        open
        loading={false}
        onDone={onDone}
        onClose={onClose}
      />
    );

    const input = screen.getByLabelText('Select image') as HTMLInputElement;

    const bad = new File(['x'], 'bad.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [bad] } });
    await waitFor(() =>
      expect(screen.getByText('Unsupported file type')).toBeInTheDocument()
    );

    const large = new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'a.jpg', {
      type: 'image/jpeg',
    });
    fireEvent.change(input, { target: { files: [large] } });
    await waitFor(() =>
      expect(screen.getByText('Max size 2MB')).toBeInTheDocument()
    );
  });

  it('calls onDone for valid file and shows preview', async () => {
    const onDone = jest.fn();
    const onClose = jest.fn();
    render(
      <ImageUploadDialog
        open
        loading={false}
        onDone={onDone}
        onClose={onClose}
        statusText="Ready"
      />
    );

    const input = screen.getByLabelText('Select image') as HTMLInputElement;
    const file = new File(['x'], 'ok.png', { type: 'image/png' });
    await userEvent.upload(input, file);

    const done = screen.getByRole('button', { name: 'Done' });
    await userEvent.click(done);
    expect(onDone).toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('Ready');
  });
});
