import React, { useState, useMemo } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils';
import type { HiringSource } from '@/types/api';

// Color mapping for categories and sources (file-level constants for stable references)
const CATEGORY_COLORS: Record<string, string> = {
  design: '#1E40AF', // dark blue
  engineering: '#EA580C', // orange
  marketing: '#0891B2', // cyan
};

const SOURCE_COLORS: Record<string, string> = {
  Direct: '#1E40AF', // dark blue (tallest)
  Dribbble: '#0891B2', // cyan (medium)
  LinkedIn: '#EA580C', // orange (short)
};

const chartVariants = cva(
  'relative overflow-hidden rounded-xl bg-white border border-gray-200 transition-all duration-200 hover:shadow-card-hover',
  {
    variants: {
      size: {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface HiringSourcesChartProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chartVariants> {
  data: HiringSource[];
  title?: string;
  showLegend?: boolean;
  maxValue?: number;
}

const HiringSourcesChart = React.forwardRef<
  HTMLDivElement,
  HiringSourcesChartProps
>(
  (
    {
      className,
      size = 'md',
      data,
      title = 'Top Hiring Sources',
      showLegend = true,
      maxValue = 100,
      ...props
    },
    ref
  ) => {
    const [activeCategories, setActiveCategories] = useState<Set<string>>(
      new Set(['design', 'engineering', 'marketing'])
    );

    // Color mapping constants moved to file scope

    // Filter data based on active categories
    const filteredData = useMemo(() => {
      return data.filter((item) => activeCategories.has(item.category));
    }, [data, activeCategories]);

    // Sort data by value (descending) for better visualization
    const sortedData = useMemo(() => {
      return [...filteredData].sort((a, b) => b.value - a.value);
    }, [filteredData]);

    // Toggle category filter
    const toggleCategory = (category: string) => {
      setActiveCategories((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(category)) {
          newSet.delete(category);
        } else {
          newSet.add(category);
        }
        return newSet;
      });
    };

    // Get unique categories from data
    const categories = useMemo(() => {
      const uniqueCategories = [...new Set(data.map((item) => item.category))];
      return uniqueCategories.map((category) => ({
        id: category,
        label: category.charAt(0).toUpperCase() + category.slice(1),
        color:
          CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] ||
          '#6B7280',
        count: data.filter((item) => item.category === category).length,
      }));
    }, [data]);

    return (
      <div
        ref={ref}
        className={cn(chartVariants({ size, className }))}
        {...props}
      >
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent pointer-events-none" />

        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <div className="text-sm text-gray-500">Scale: 0-{maxValue}</div>
          </div>

          {/* Chart Container */}
          <div className="space-y-4 mb-6">
            {sortedData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No data available for selected categories
              </div>
            ) : (
              sortedData.map((item, index) => (
                <ChartBar
                  key={item.id}
                  source={item.source}
                  value={item.value}
                  maxValue={maxValue}
                  color={
                    SOURCE_COLORS[item.source as keyof typeof SOURCE_COLORS] ||
                    CATEGORY_COLORS[item.category]
                  }
                  category={item.category}
                  index={index}
                />
              ))
            )}
          </div>

          {/* Interactive Legend */}
          {showLegend && categories.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <div className="flex flex-wrap gap-3">
                {categories.map((category) => (
                  <LegendItem
                    key={category.id}
                    category={category}
                    isActive={activeCategories.has(category.id)}
                    onClick={() => toggleCategory(category.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

HiringSourcesChart.displayName = 'HiringSourcesChart';

// Individual chart bar component
interface ChartBarProps {
  source: string;
  value: number;
  maxValue: number;
  color: string;
  category: string;
  index: number;
}

const ChartBar: React.FC<ChartBarProps> = ({
  source,
  value,
  maxValue,
  color,
  category,
  index,
}) => {
  const percentage = Math.min((value / maxValue) * 100, 100);

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-900">{source}</span>
          <span className="text-xs text-gray-500 capitalize">({category})</span>
        </div>
        <span className="text-sm font-semibold text-gray-700">{value}</span>
      </div>

      <div className="relative">
        {/* Background bar */}
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          {/* Progress bar with animation */}
          <div
            className="h-full rounded-full transition-all duration-700 ease-out group-hover:opacity-80"
            style={{
              width: `${percentage}%`,
              backgroundColor: color,
              animationDelay: `${index * 100}ms`,
            }}
          />
        </div>

        {/* Scale markers */}
        <div className="flex justify-between mt-1 text-xs text-gray-400">
          <span>0</span>
          <span>{Math.round(maxValue * 0.25)}</span>
          <span>{Math.round(maxValue * 0.5)}</span>
          <span>{Math.round(maxValue * 0.75)}</span>
          <span>{maxValue}</span>
        </div>
      </div>
    </div>
  );
};

// Legend item component
interface LegendItemProps {
  category: {
    id: string;
    label: string;
    color: string;
    count: number;
  };
  isActive: boolean;
  onClick: () => void;
}

const LegendItem: React.FC<LegendItemProps> = ({
  category,
  isActive,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
        'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1',
        isActive
          ? 'bg-white border border-gray-200 text-gray-900 shadow-sm'
          : 'bg-gray-100 text-gray-500 opacity-60'
      )}
    >
      <div
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: isActive ? category.color : '#9CA3AF' }}
      />
      <span>{category.label}</span>
      <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
        {category.count}
      </span>
    </button>
  );
};

export { HiringSourcesChart, chartVariants };
