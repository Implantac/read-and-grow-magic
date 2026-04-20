import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FiscalStep {
  id: string;
  label: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface FiscalStepperProps {
  steps: FiscalStep[];
  currentStep: number;
  onStepClick?: (index: number) => void;
  completedSteps?: Set<number>;
}

export function FiscalStepper({ steps, currentStep, onStepClick, completedSteps }: FiscalStepperProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-1">
        {steps.map((step, idx) => {
          const isActive = idx === currentStep;
          const isCompleted = completedSteps?.has(idx) || idx < currentStep;
          const isClickable = onStepClick && (isCompleted || idx === currentStep);
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex-1 flex items-center">
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick?.(idx)}
                className={cn(
                  'flex flex-col items-center gap-1.5 group flex-1 transition-opacity',
                  !isClickable && 'cursor-default',
                  isClickable && 'cursor-pointer hover:opacity-80'
                )}
              >
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all',
                    isActive && 'border-primary bg-primary text-primary-foreground shadow-md scale-110',
                    isCompleted && !isActive && 'border-success bg-success text-success-foreground',
                    !isActive && !isCompleted && 'border-border bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted && !isActive ? (
                    <Check className="h-4 w-4" />
                  ) : Icon ? (
                    <Icon className="h-4 w-4" />
                  ) : (
                    idx + 1
                  )}
                </div>
                <div className="text-center">
                  <div
                    className={cn(
                      'text-xs font-medium leading-tight',
                      isActive && 'text-foreground',
                      !isActive && 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </div>
                </div>
              </button>
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 mx-1 transition-colors -mt-6',
                    isCompleted ? 'bg-success' : 'bg-border'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
