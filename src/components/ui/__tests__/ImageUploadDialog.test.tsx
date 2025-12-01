import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImageUploadDialog from '@/components/ui/ImageUploadDialog';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    const { unoptimized, fill, ...rest } = props;
    return React.createElement('img', { ...rest });
  },
}));

describe('ImageUploadDialog', () => {
  it('validates file type', async () => {
    const user = userEvent.setup();
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
    expect(await screen.findByText('Unsupported file type')).toBeInTheDocument();
  });

  it('validates file size', async () => {
    const user = userEvent.setup();
    const onDone = jest.fn();
    const onClose = jest.fn();
    render(
      <ImageUploadDialog
        open
        loading={false}
        onDone={onDone}
        onClose={onClose}
        maxSizeMB={2}
      />
    );

    const input = screen.getByLabelText('Select image') as HTMLInputElement;
    const large = new File(['x'], 'a.jpg', { type: 'image/jpeg' });
    Object.defineProperty(large, 'size', { value: 2 * 1024 * 1024 + 1 });
    fireEvent.change(input, { target: { files: [large] } });
    expect(await screen.findByText('Max size 2MB')).toBeInTheDocument();
  });

  it('calls onDone for valid file and shows preview', async () => {
    const user = userEvent.setup();
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
    fireEvent.change(input, { target: { files: [file] } });

    const done = screen.getByRole('button', { name: 'Done' });
    await user.click(done);
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(screen.getByRole('status')).toHaveTextContent('Ready');
  });
});
