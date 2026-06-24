import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

import type { FiscalStep } from '@/modules/fiscal/types';
export type { FiscalStep };

interface FiscalStepperProps {
  steps: FiscalStep[];
  currentStep: number;
  onStepClick?: (index: number) => void;
  completedSteps?: Set<number>;
}

export function FiscalStepper({ steps, currentStep, onStepClick, completedSteps }: FiscalStepperProps) {
  return (
    <div className="w-full py-4">
      <div className="relative flex items-center justify-between">
        {/* Background Line */}
        <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-muted" />
        
        {/* Progress Line */}
        <div 
          className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-primary transition-all duration-500 ease-in-out" 
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, idx) => {
          const isActive = idx === currentStep;
          const isCompleted = completedSteps?.has(idx) || idx < currentStep;
          const isClickable = onStepClick && (isCompleted || idx === currentStep || idx === currentStep + 1);
          const Icon = step.icon;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick?.(idx)}
                className={cn(
                  'group flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300',
                  isActive && 'border-primary bg-background text-primary ring-4 ring-primary/20 scale-110',
                  isCompleted && !isActive && 'border-primary bg-primary text-primary-foreground',
                  !isActive && !isCompleted && 'border-muted bg-background text-muted-foreground hover:border-muted-foreground/50',
                  !isClickable && 'cursor-not-allowed opacity-50'
                )}
              >
                {isCompleted && !isActive ? (
                  <Check className="h-5 w-5 stroke-[3]" />
                ) : Icon ? (
                  <Icon className={cn("h-5 w-5", isActive && "animate-pulse")} />
                ) : (
                  <span className="text-sm font-bold">{idx + 1}</span>
                )}
                
                {/* Tooltip/Label below */}
                <div className={cn(
                  "absolute top-full mt-2 w-max max-w-[120px] text-center transition-all duration-300",
                  isActive ? "opacity-100 translate-y-0" : "opacity-70 -translate-y-1"
                )}>
                  <p className={cn(
                    "text-[11px] font-bold uppercase tracking-wider",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}>
                    {step.label}
                  </p>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
