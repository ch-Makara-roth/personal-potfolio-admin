import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/utils';
import {
  useId,
  useHighContrast,
  useReducedMotion,
} from '@/hooks/useAccessibility';

const statsCardVariants = cva(
  'relative overflow-hidden rounded-xl bg-white border transition-all duration-200 hover:shadow-card-hover',
  {
    variants: {
      variant: {
        applications:
          'border-purple-200 bg-gradient-to-br from-purple-50 to-white',
        interviews: 'border-blue-200 bg-gradient-to-br from-blue-50 to-white',
        hired: 'border-cyan-200 bg-gradient-to-br from-cyan-50 to-white',
      },
      size: {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'applications',
      size: 'md',
    },
  }
);

const iconVariants = cva('rounded-lg p-2', {
  variants: {
    variant: {
      applications: 'bg-purple-100 text-purple-600',
      interviews: 'bg-blue-100 text-blue-600',
      hired: 'bg-cyan-100 text-cyan-600',
    },
  },
});

export interface TrendData {
  data: number[];
  color?: string;
}

export interface StatsCardProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statsCardVariants> {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: TrendData;
  subtitle?: string;
  formatValue?: (value: number | string) => string;
}

const StatsCard = React.forwardRef<HTMLDivElement, StatsCardProps>(
  (
    {
      className,
      variant = 'applications',
      size = 'md',
      title,
      value,
      icon: Icon,
      trend,
      subtitle,
      formatValue,
      ...props
    },
    ref
  ) => {
    const formattedValue = formatValue ? formatValue(value) : value.toString();
    const isHighContrast = useHighContrast();
    const shouldReduceMotion = useReducedMotion();

    // Generate stable IDs for ARIA relationships
    const titleId = useId('stats-title');
    const valueId = useId('stats-value');
    const trendId = useId('stats-trend');

    // Calculate trend direction for accessibility
    const trendDirection =
      trend && trend.data.length >= 2
        ? trend.data[trend.data.length - 1] > trend.data[0]
          ? 'increasing'
          : 'decreasing'
        : null;

    // High contrast mode adjustments
    const highContrastClasses = isHighContrast
      ? 'border-2 border-solid border-current'
      : '';

    // Reduced motion adjustments
    const transitionClasses = shouldReduceMotion
      ? ''
      : 'transition-all duration-200 hover:shadow-card-hover';

    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden rounded-xl bg-white border',
          transitionClasses,
          statsCardVariants({ variant, size }),
          highContrastClasses,
          className
        )}
        role="region"
        aria-labelledby={titleId}
        aria-describedby={`${valueId} ${trendDirection ? trendId : ''}`}
        tabIndex={0}
        {...props}
      >
        {/* Background gradient overlay */}
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-br from-white/50 to-transparent pointer-events-none',
            isHighContrast && 'hidden'
          )}
          aria-hidden="true"
        />

        <div className="relative">
          {/* Header with icon and title */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div
                className={cn(
                  iconVariants({ variant }),
                  isHighContrast && 'border border-current'
                )}
                role="img"
                aria-label={`${title} icon`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h3 id={titleId} className="text-sm font-medium text-gray-600">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
                )}
              </div>
            </div>
          </div>

          {/* Value display */}
          <div className="mb-4">
            <div
              id={valueId}
              className="text-2xl font-bold text-gray-900 mb-1"
              aria-label={`Current value: ${formattedValue}`}
            >
              {formattedValue}
            </div>
          </div>

          {/* Trend visualization */}
          {trend && trend.data.length > 0 && variant && (
            <div className="mt-4">
              <TrendLine
                data={trend.data}
                variant={variant}
                trendId={trendId}
                trendDirection={trendDirection}
              />
            </div>
          )}
        </div>
      </div>
    );
  }
);

StatsCard.displayName = 'StatsCard';

// Simple trend line component using SVG
interface TrendLineProps {
  data: number[];
  variant: 'applications' | 'interviews' | 'hired';
  trendId?: string;
  trendDirection?: 'increasing' | 'decreasing' | null;
}

const TrendLine: React.FC<TrendLineProps> = ({
  data,
  variant,
  trendId,
  trendDirection,
}) => {
  const isHighContrast = useHighContrast();
  const shouldReduceMotion = useReducedMotion();

  if (data.length < 2) return null;

  const width = 120;
  const height = 32;
  const padding = 4;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  // Generate SVG path
  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
    const y =
      height - padding - ((value - min) / range) * (height - 2 * padding);
    return `${x},${y}`;
  });

  const pathData = `M ${points.join(' L ')}`;

  const strokeColor = {
    applications: '#6B46C1', // purple-600
    interviews: '#3182CE', // blue-600
    hired: '#06B6D4', // cyan-500
  }[variant];

  const fillColor = isHighContrast
    ? 'none'
    : {
        applications: 'url(#purpleGradient)',
        interviews: 'url(#blueGradient)',
        hired: 'url(#cyanGradient)',
      }[variant];

  // Generate unique gradient IDs to avoid conflicts
  const gradientId = `${variant}Gradient-${Math.random().toString(36).substr(2, 9)}`;

  const trendText =
    trendDirection === 'increasing' ? 'Trending up' : 'Trending down';
  const trendIcon = trendDirection === 'increasing' ? '↗' : '↘';

  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <svg
          width={width}
          height={height}
          className="overflow-visible"
          role="img"
          aria-labelledby={trendId}
          aria-describedby={`${trendId}-desc`}
        >
          <title id={trendId}>
            Trend chart showing {trendDirection} pattern
          </title>
          <desc id={`${trendId}-desc`}>
            Chart displaying {data.length} data points with values ranging from{' '}
            {min} to {max}
          </desc>

          {!isHighContrast && (
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={strokeColor} stopOpacity="0.2" />
                <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
              </linearGradient>
            </defs>
          )}

          {/* Fill area under the curve */}
          {!isHighContrast && (
            <path
              d={`${pathData} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`}
              fill={fillColor}
              aria-hidden="true"
            />
          )}

          {/* Trend line */}
          <path
            d={pathData}
            stroke={strokeColor}
            strokeWidth={isHighContrast ? '3' : '2'}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          />

          {/* Data points */}
          {points.map((point, index) => {
            const [x, y] = point.split(',').map(Number);
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r={isHighContrast ? '3' : '2'}
                fill={strokeColor}
                className={shouldReduceMotion ? '' : 'drop-shadow-sm'}
                aria-hidden="true"
              />
            );
          })}
        </svg>
      </div>

      {/* Trend indicator */}
      <div className="ml-3 text-right">
        <div className="text-xs text-gray-500">Trend</div>
        <div
          className={cn(
            'text-sm font-medium',
            trendDirection === 'increasing' ? 'text-green-600' : 'text-red-500'
          )}
          aria-label={trendText}
        >
          <span aria-hidden="true">{trendIcon}</span>
          <span className="sr-only">{trendText}</span>
        </div>
      </div>
    </div>
  );
};

export { StatsCard, statsCardVariants };
