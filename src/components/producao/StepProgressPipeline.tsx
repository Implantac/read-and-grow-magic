import { useProductionOrderSteps, ProductionOrderStep } from '@/hooks/production/useProductionSteps';
import { cn } from '@/lib/utils';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/ui/base/tooltip';

interface StepProgressPipelineProps {
  orderId: string;
  compact?: boolean;
}

const statusIcon = (status: string) => {
  if (status === 'completed') return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
  if (status === 'in_progress') return <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />;
  return <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />;
};

export function StepProgressPipeline({ orderId, compact = false }: StepProgressPipelineProps) {
  const { orderSteps, loading } = useProductionOrderSteps(orderId);

  if (loading) return <span className="text-xs text-muted-foreground">...</span>;
  if (orderSteps.length === 0) return <span className="text-xs text-muted-foreground italic">Sem etapas</span>;

  const completedCount = orderSteps.filter(s => s.status === 'completed').length;
  const currentStep = orderSteps.find(s => s.status === 'in_progress');

  if (compact) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-0.5">
              {orderSteps.map((step, i) => (
                <div key={step.id} className="flex items-center gap-0.5">
                  <div className={cn(
                    'h-2 w-2 rounded-full transition-colors',
                    step.status === 'completed' && 'bg-green-500',
                    step.status === 'in_progress' && 'bg-primary animate-pulse',
                    step.status === 'pending' && 'bg-muted-foreground/25',
                  )} />
                  {i < orderSteps.length - 1 && (
                    <div className={cn(
                      'h-px w-2',
                      step.status === 'completed' ? 'bg-green-500/50' : 'bg-muted-foreground/15',
                    )} />
                  )}
                </div>
              ))}
              <span className="ml-1 text-[10px] text-muted-foreground">{completedCount}/{orderSteps.length}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-0.5 text-xs">
              {orderSteps.map((s, i) => (
                <div key={s.id} className="flex items-center gap-1.5">
                  {statusIcon(s.status)}
                  <span className={cn(s.status === 'in_progress' && 'font-semibold')}>
                    {s.step_name || `Etapa ${s.sequence}`}
                  </span>
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full visual pipeline
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {orderSteps.map((step, i) => (
        <div key={step.id} className="flex items-center gap-1">
          <div className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors',
            step.status === 'completed' && 'bg-green-500/10 text-green-700 dark:text-green-400',
            step.status === 'in_progress' && 'bg-primary/10 text-primary ring-1 ring-primary/30',
            step.status === 'pending' && 'bg-muted text-muted-foreground',
          )}>
            {statusIcon(step.status)}
            <span className="max-w-[100px] truncate">{step.step_name || `Etapa ${step.sequence}`}</span>
          </div>
          {i < orderSteps.length - 1 && (
            <span className={cn(
              'text-xs',
              step.status === 'completed' ? 'text-green-500' : 'text-muted-foreground/30',
            )}>→</span>
          )}
        </div>
      ))}
    </div>
  );
}
