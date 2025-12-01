import React, { useState, useEffect } from 'react';
import { Rocket, X, Check, Loader2 } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils';
import { Card, CardContent } from './Card';
import { Button } from './Button';
import {
  useCurrentPlan,
  useUpgradeActions,
  upgradeTransformers,
} from '@/hooks/api';

const upgradeCardVariants = cva(
  'relative overflow-hidden border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50',
  {
    variants: {
      size: {
        default: 'p-6',
        compact: 'p-4',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

export interface UpgradeCardProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof upgradeCardVariants> {
  features?: string[];
  onUpgrade?: () => void;
  onDismiss?: () => void;
  dismissible?: boolean;
  storageKey?: string;
  source?: 'dashboard_card' | 'header_badge' | 'settings_page';
}

const UpgradeCard = React.forwardRef<HTMLDivElement, UpgradeCardProps>(
  (
    {
      className,
      size,
      features = [
        'Unlimited job postings',
        'Advanced analytics dashboard',
        'Priority candidate matching',
        'Custom branding options',
        'Dedicated support team',
      ],
      onUpgrade,
      onDismiss,
      dismissible = true,
      storageKey = 'upgrade-card-dismissed',
      source = 'dashboard_card',
      ...props
    },
    ref
  ) => {
    const [isDismissed, setIsDismissed] = useState(false);

    // Get current plan data
    const { data: currentPlanData, isLoading: isLoadingPlan } =
      useCurrentPlan();
    const { handleUpgradeClick, trackUpgradeView, isUpgrading } =
      useUpgradeActions();

    // Load dismissed state from localStorage on mount
    useEffect(() => {
      if (dismissible && storageKey) {
        const dismissed = localStorage.getItem(storageKey);
        setIsDismissed(dismissed === 'true');
      }
    }, [dismissible, storageKey]);

    // Track upgrade view when component mounts
    useEffect(() => {
      if (!isDismissed && currentPlanData?.data.plan.type === 'free') {
        trackUpgradeView(source);
      }
    }, [isDismissed, currentPlanData, source, trackUpgradeView]);

    const handleDismiss = () => {
      setIsDismissed(true);
      if (storageKey) {
        localStorage.setItem(storageKey, 'true');
      }
      onDismiss?.();
    };

    const handleUpgrade = () => {
      handleUpgradeClick(source, 'pro');
      onUpgrade?.();
    };

    // Don't render if dismissed
    if (isDismissed) {
      return null;
    }

    // Show loading state while fetching plan data
    if (isLoadingPlan) {
      return (
        <Card
          className={cn(upgradeCardVariants({ size, className }))}
          {...props}
        >
          <CardContent className="p-0">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            </div>
          </CardContent>
        </Card>
      );
    }

    const currentPlan = currentPlanData?.data.plan;
    const currentPlanName = currentPlan?.name || 'Free Plan';

    // Don't render if user is already on pro plan (after loading is complete)
    if (currentPlan && currentPlan.type !== 'free') {
      return null;
    }

    return (
      <Card
        ref={ref}
        className={cn(upgradeCardVariants({ size, className }))}
        {...props}
      >
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            aria-label="Dismiss upgrade card"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        )}

        <CardContent className="p-0">
          <div className="flex items-start gap-4">
            {/* Rocket Icon */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Rocket className="h-6 w-6 text-white" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="mb-3">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Upgrade to Pro
                </h3>
                <p className="text-sm text-gray-600">
                  You&apos;re currently on the {currentPlanName}. Unlock
                  powerful features with Pro.
                </p>
              </div>

              {/* Feature List */}
              <div className="mb-4">
                <ul className="space-y-2">
                  {features.slice(0, 3).map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <Check className="h-4 w-4 text-purple-600 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {features.length > 3 && (
                    <li className="text-sm text-gray-500 ml-6">
                      +{features.length - 3} more features
                    </li>
                  )}
                </ul>
              </div>

              {/* Upgrade Button */}
              <Button
                variant="gradient"
                size="md"
                onClick={handleUpgrade}
                disabled={isUpgrading}
                className="w-full sm:w-auto"
              >
                {isUpgrading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4 mr-2" />
                    Upgrade Now
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

UpgradeCard.displayName = 'UpgradeCard';

export { UpgradeCard, upgradeCardVariants };
