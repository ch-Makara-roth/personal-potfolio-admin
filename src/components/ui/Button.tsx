import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils';
import { useHighContrast } from '@/hooks/useAccessibility';
import { useTouchFriendly } from '@/hooks/useResponsive';

const buttonVariants = cva('btn-base', {
  variants: {
    variant: {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      outline: 'btn-outline',
      ghost: 'btn-ghost',
      gradient:
        'gradient-purple text-white shadow-sm hover:shadow-md focus:ring-purple-500',
      destructive:
        'bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
    },
    size: {
      sm: 'btn-sm',
      md: 'btn-md',
      lg: 'btn-lg',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  'aria-describedby'?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      loadingText = 'Loading...',
      disabled,
      children,
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const isHighContrast = useHighContrast();
    const { getMinTouchTarget, isTouch } = useTouchFriendly();
    const isDisabled = disabled || loading;

    // Generate appropriate ARIA attributes
    const ariaAttributes = {
      'aria-disabled': isDisabled,
      'aria-busy': loading,
      'aria-describedby': ariaDescribedBy,
      ...(loading && { 'aria-live': 'polite' as const }),
    };

    // High contrast mode adjustments
    const highContrastClasses = isHighContrast
      ? 'border-2 border-solid border-current'
      : '';

    // Touch-friendly sizing
    const touchClasses = isTouch ? getMinTouchTarget() : '';

    return (
      <button
        className={cn(
          buttonVariants({ variant, size }),
          highContrastClasses,
          touchClasses,
          className
        )}
        ref={ref}
        disabled={isDisabled}
        {...ariaAttributes}
        {...props}
      >
        {loading && <span className="sr-only">{loadingText}</span>}
        {loading ? (
          <div className="flex items-center space-x-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>{loadingText}</span>
          </div>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
