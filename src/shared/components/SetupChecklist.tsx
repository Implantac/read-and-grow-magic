import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Progress } from '@/ui/base/progress';
import { Skeleton } from '@/ui/base/skeleton';
import { cn } from '@/lib/utils';
import { useSetupProgress } from '@/hooks/system/useSetupProgress';

interface SetupChecklistProps {
  className?: string;
}

/**
 * Guia de primeira configuração. Só aparece enquanto houver etapa pendente.
 */
export function SetupChecklist({ className }: SetupChecklistProps) {
  const navigate = useNavigate();
  const { steps, completed, total, isComplete, isLoading, hasCompany } = useSetupProgress();

  if (!hasCompany || isComplete) return null;

  if (isLoading) {
    return (
      <Card className={cn('border-border/60', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Primeiros passos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const pending = steps.filter((s) => !s.done);

  return (
    <Card className={cn('border-border/60', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Primeiros passos</CardTitle>
        <p className="text-sm text-muted-foreground">
          {completed} de {total} concluídos — falta pouco para a operação rodar completa.
        </p>
        <Progress
          value={percent}
          className="mt-2 h-2"
          aria-label={`Configuração inicial: ${percent}% concluída`}
        />
      </CardHeader>
      <CardContent className="space-y-2">
        {steps.map((step) => (
          <div
            key={step.id}
            className={cn(
              'flex flex-col gap-2 rounded-lg border border-border/50 p-3 sm:flex-row sm:items-center sm:justify-between',
              step.done && 'opacity-60'
            )}
          >
            <div className="flex items-start gap-3">
              {step.done ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {step.title}
                  <span className="sr-only">{step.done ? ' (concluído)' : ' (pendente)'}</span>
                </p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
            {!step.done && (
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-1 sm:w-auto"
                onClick={() => navigate(step.href)}
              >
                {step.actionLabel}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            )}
          </div>
        ))}
        {pending.length === 0 && (
          <p className="text-sm text-muted-foreground">Tudo pronto.</p>
        )}
      </CardContent>
    </Card>
  );
}
