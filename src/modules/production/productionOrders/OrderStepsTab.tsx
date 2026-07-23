import { Card, CardContent } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Progress } from '@/ui/base/progress';
import { EmptyState } from '@/shared/components/EmptyState';
import { Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProductionOrderSteps } from '@/hooks/production/useProductionSteps';

export function OrderStepsTab({ orderId }: { orderId: string }) {
  const { orderSteps, loading } = useProductionOrderSteps(orderId);

  if (loading) return <p className="text-center py-8 text-muted-foreground">Carregando etapas...</p>;
  if (orderSteps.length === 0) {
    return <EmptyState icon={Layers} title="Nenhuma etapa cadastrada para esta OP" description='Use a tela "Etapas de Produção" para configurar o roteiro desta ordem.' />;
  }
  return (
    <div className="space-y-2">
      {orderSteps.map((step, idx) => {
        const stepProgress = step.quantity_pending > 0
          ? ((step.quantity_produced / (step.quantity_produced + step.quantity_pending)) * 100)
          : (step.status === 'completed' ? 100 : 0);
        return (
          <Card key={step.id} className={cn(step.status === 'completed' && 'border-green-300 dark:border-green-800', step.status === 'in_progress' && 'border-primary')}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-bold">{idx + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{step.step_name || `Etapa ${step.sequence}`}</p>
                  <Badge variant={step.status === 'completed' ? 'default' : step.status === 'in_progress' ? 'default' : 'secondary'} className="text-[10px]">
                    {step.status === 'completed' ? '✅ Concluída' : step.status === 'in_progress' ? '🔄 Em andamento' : '⏳ Pendente'}
                  </Badge>
                </div>
                {step.step_sector && <p className="text-xs text-muted-foreground">Setor: {step.step_sector}</p>}
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={stepProgress} className="w-24 h-1.5" />
                  <span className="text-xs text-muted-foreground">{step.quantity_produced}/{step.quantity_produced + step.quantity_pending}</span>
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                {step.responsible && <p>{step.responsible}</p>}
                {step.realized_time_minutes > 0 && <p>{(step.realized_time_minutes / 60).toFixed(1)}h</p>}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
