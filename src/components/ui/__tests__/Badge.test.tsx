import { render, screen } from '@testing-library/react';
import { Badge } from '../Badge';

describe('Badge', () => {
  it('renders with default props', () => {
    render(<Badge data-testid="badge">Badge text</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass(
      'badge-base',
      'badge-primary',
      'px-2.5',
      'py-0.5',
      'text-xs'
    );
    expect(badge).toHaveTextContent('Badge text');
  });

  it('renders with different variants', () => {
    const { rerender } = render(
      <Badge variant="secondary" data-testid="badge">
        Secondary
      </Badge>
    );
    expect(screen.getByTestId('badge')).toHaveClass('badge-secondary');

    rerender(
      <Badge variant="success" data-testid="badge">
        Success
      </Badge>
    );
    expect(screen.getByTestId('badge')).toHaveClass('badge-success');

    rerender(
      <Badge variant="warning" data-testid="badge">
        Warning
      </Badge>
    );
    expect(screen.getByTestId('badge')).toHaveClass('badge-warning');

    rerender(
      <Badge variant="info" data-testid="badge">
        Info
      </Badge>
    );
    expect(screen.getByTestId('badge')).toHaveClass('badge-info');

    rerender(
      <Badge variant="outline" data-testid="badge">
        Outline
      </Badge>
    );
    expect(screen.getByTestId('badge')).toHaveClass(
      'border',
      'border-current',
      'bg-transparent'
    );

    rerender(
      <Badge variant="gradient" data-testid="badge">
        Gradient
      </Badge>
    );
    expect(screen.getByTestId('badge')).toHaveClass(
      'gradient-purple',
      'text-white'
    );
  });

  it('renders with different sizes', () => {
    const { rerender } = render(
      <Badge size="sm" data-testid="badge">
        Small
      </Badge>
    );
    expect(screen.getByTestId('badge')).toHaveClass(
      'px-2',
      'py-0.5',
      'text-xs'
    );

    rerender(
      <Badge size="lg" data-testid="badge">
        Large
      </Badge>
    );
    expect(screen.getByTestId('badge')).toHaveClass('px-3', 'py-1', 'text-sm');
  });

  it('accepts custom className', () => {
    render(
      <Badge className="custom-class" data-testid="badge">
        Custom
      </Badge>
    );
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('custom-class');
  });

  it('renders numeric content', () => {
    render(<Badge data-testid="badge">42</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveTextContent('42');
  });
});
