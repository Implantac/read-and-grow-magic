import { Card, CardContent } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Progress } from '@/ui/base/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Skeleton } from '@/ui/base/skeleton';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { CheckCircle, Clock, Factory, Layers, Play, Plus, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  activeOrders: any[];
  selectedOrderId: string;
  onSelectOrder: (id: string) => void;
  orderSteps: any[];
  orderStepsLoading: boolean;
  onOpenGenerateForOrder: () => void;
  onStepStatusChange: (stepId: string, status: string) => void;
}

export function OrderStepsTrackingTab({
  activeOrders,
  selectedOrderId,
  onSelectOrder,
  orderSteps,
  orderStepsLoading,
  onOpenGenerateForOrder,
  onStepStatusChange,
}: Props) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <Factory className="h-5 w-5 text-muted-foreground" />
            <Select value={selectedOrderId} onValueChange={onSelectOrder}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecione uma Ordem de Produção..." />
              </SelectTrigger>
              <SelectContent>
                {activeOrders.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.order_number} — {o.product_name} ({o.produced_quantity}/{o.quantity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedOrderId && (
        orderStepsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : orderSteps.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Nenhuma etapa gerada para esta OP</p>
              <p className="text-sm text-muted-foreground mb-4">
                Clique em "Gerar Etapas p/ OP" para criar o fluxo produtivo
              </p>
              <Button onClick={onOpenGenerateForOrder}>
                <Plus className="h-4 w-4 mr-2" /> Gerar Etapas Agora
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progresso das etapas</span>
                      <span className="font-bold">
                        {orderSteps.filter((s) => s.status === 'completed').length}/{orderSteps.length} concluídas
                      </span>
                    </div>
                    <Progress
                      value={(orderSteps.filter((s) => s.status === 'completed').length / orderSteps.length) * 100}
                      className="h-3"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {orderSteps.map((step, idx) => {
              const stepProgress = step.quantity_pending > 0
                ? ((step.quantity_produced / (step.quantity_produced + step.quantity_pending)) * 100)
                : (step.status === 'completed' ? 100 : 0);

              return (
                <Card
                  key={step.id}
                  className={cn(
                    'transition-all',
                    step.status === 'completed' && 'border-success/50 bg-success/5',
                    step.status === 'in_progress' && 'border-primary/50 bg-primary/5',
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          'flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold shrink-0',
                          step.status === 'completed' ? 'bg-success/20 text-success' :
                            step.status === 'in_progress' ? 'bg-primary/20 text-primary' :
                              'bg-muted text-muted-foreground'
                        )}
                      >
                        {step.status === 'completed' ? '✓' : idx + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium">{step.step_name || `Etapa ${step.sequence}`}</p>
                          {step.step_sector && (
                            <div className="text-[10px] border px-2 py-0.5 rounded">📍 {step.step_sector}</div>
                          )}
                          <StatusBadge status={step.status} type="production" className="text-[10px]" />
                        </div>
                        <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                          {step.responsible && (
                            <span className="flex items-center gap-1"><User className="h-3 w-3" /> {step.responsible}</span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Est: {step.estimated_time_minutes}min
                          </span>
                          {step.realized_time_minutes > 0 && <span>Real: {step.realized_time_minutes}min</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Progress value={stepProgress} className="w-32 h-2" />
                          <span className="text-xs">
                            {step.quantity_produced}/{step.quantity_produced + step.quantity_pending} peças
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-1 shrink-0">
                        {step.status === 'pending' && (
                          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => onStepStatusChange(step.id, 'in_progress')}>
                            <Play className="h-3 w-3 mr-1" /> Iniciar
                          </Button>
                        )}
                        {step.status === 'in_progress' && (
                          <Button size="sm" className="h-8 text-xs" onClick={() => onStepStatusChange(step.id, 'completed')}>
                            <CheckCircle className="h-3 w-3 mr-1" /> Concluir
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
