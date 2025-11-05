import { render, screen, waitFor } from '@testing-library/react';
import { Avatar } from '../Avatar';

describe('Avatar', () => {
  it('renders with default props and fallback', () => {
    render(<Avatar data-testid="avatar" fallback="John Doe" />);
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveClass('avatar-base', 'avatar-md');
    expect(avatar).toHaveTextContent('JD');
  });

  it('renders with different sizes', () => {
    const { rerender } = render(
      <Avatar size="sm" data-testid="avatar" fallback="Test" />
    );
    expect(screen.getByTestId('avatar')).toHaveClass('avatar-sm');

    rerender(<Avatar size="lg" data-testid="avatar" fallback="Test" />);
    expect(screen.getByTestId('avatar')).toHaveClass('avatar-lg');

    rerender(<Avatar size="xl" data-testid="avatar" fallback="Test" />);
    expect(screen.getByTestId('avatar')).toHaveClass('avatar-xl');
  });

  it('generates correct initials from fallback text', () => {
    const { rerender } = render(
      <Avatar data-testid="avatar" fallback="John Doe" />
    );
    expect(screen.getByTestId('avatar')).toHaveTextContent('JD');

    rerender(<Avatar data-testid="avatar" fallback="Alice" />);
    expect(screen.getByTestId('avatar')).toHaveTextContent('A');

    rerender(<Avatar data-testid="avatar" fallback="Bob Smith Johnson" />);
    expect(screen.getByTestId('avatar')).toHaveTextContent('BS');

    rerender(<Avatar data-testid="avatar" fallback="" />);
    expect(screen.getByTestId('avatar')).toHaveTextContent('?');
  });

  it('accepts custom className', () => {
    render(
      <Avatar className="custom-class" data-testid="avatar" fallback="Test" />
    );
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toHaveClass('custom-class');
  });

  it('shows fallback when no src provided', () => {
    render(<Avatar data-testid="avatar" fallback="Test User" />);
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toHaveTextContent('TU');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
