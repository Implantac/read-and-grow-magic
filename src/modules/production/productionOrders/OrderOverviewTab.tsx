import { Card, CardContent } from '@/ui/base/card';
import { Progress } from '@/ui/base/progress';
import { StepProgressPipeline } from '@/components/production/StepProgressPipeline';
import { format, parseISO } from 'date-fns';
import type { ProductionOrderRow } from '@/hooks/production/useProductionOrders';

export function OrderOverviewTab({ order }: { order: ProductionOrderRow }) {
  const progress = order.quantity > 0 ? (order.produced_quantity / order.quantity) * 100 : 0;
  const estimatedH = order.estimated_time_minutes > 0 ? (order.estimated_time_minutes / 60).toFixed(1) : '-';
  const realizedH = order.realized_time_minutes > 0 ? (order.realized_time_minutes / 60).toFixed(1) : '-';
  const timeEfficiency = order.estimated_time_minutes > 0 && order.realized_time_minutes > 0
    ? ((order.estimated_time_minutes / order.realized_time_minutes) * 100).toFixed(0) : '-';

  return (
    <div className="space-y-4 mt-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div><p className="text-xs text-muted-foreground">Produto</p><p className="font-medium">{order.product_name}</p><p className="text-xs text-muted-foreground">{order.product_code}</p></div>
        <div><p className="text-xs text-muted-foreground">Cliente</p><p className="font-medium">{order.client_name || '-'}</p></div>
        <div><p className="text-xs text-muted-foreground">Setor</p><p className="font-medium">{order.sector || order.work_center || '-'}</p></div>
        <div><p className="text-xs text-muted-foreground">Operador</p><p className="font-medium">{order.operator || '-'}</p></div>
        <div><p className="text-xs text-muted-foreground">Data Início</p><p className="font-medium">{order.start_date ? format(parseISO(order.start_date), 'dd/MM/yyyy') : '-'}</p></div>
        <div><p className="text-xs text-muted-foreground">Prazo</p><p className="font-medium">{order.due_date ? format(parseISO(order.due_date), 'dd/MM/yyyy') : '-'}</p></div>
      </div>

      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span>Produção: {order.produced_quantity} / {order.quantity} {order.unit}</span>
            <span className="font-semibold">{progress.toFixed(0)}%</span>
          </div>
          <Progress value={progress} className="h-3" />
          {order.rejected_quantity > 0 && (
            <p className="text-xs text-destructive">⚠ {order.rejected_quantity} rejeitadas — {order.defect_notes || 'sem detalhes'}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Fluxo de Etapas</p>
          <StepProgressPipeline orderId={order.id} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Estimado</p><p className="text-xl font-bold">{estimatedH}h</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Realizado</p><p className="text-xl font-bold">{realizedH}h</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Eficiência</p><p className="text-xl font-bold">{timeEfficiency}%</p></CardContent></Card>
      </div>

      {(order.color || order.size_grid || order.model_variant || order.batch_code) && (
        <div className="flex gap-2 flex-wrap">
          {order.color && <div className="text-xs px-2 py-0.5 rounded border">🎨 {order.color}</div>}
          {order.size_grid && <div className="text-xs px-2 py-0.5 rounded border">📐 {order.size_grid}</div>}
          {order.model_variant && <div className="text-xs px-2 py-0.5 rounded border">📦 {order.model_variant}</div>}
          {order.batch_code && <div className="text-xs px-2 py-0.5 rounded border">🏷️ {order.batch_code}</div>}
        </div>
      )}

      {order.notes && (
        <div><p className="text-xs text-muted-foreground">Observações</p><p className="p-3 bg-muted rounded-lg text-sm">{order.notes}</p></div>
      )}
    </div>
  );
}
