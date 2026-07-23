import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowRight } from 'lucide-react';
import { useOrderStatusHistory } from '@/hooks/commercial/useOrderFlow';
import { OrderFlowBadge } from './OrderFlowIndicators';

export function OrderTimeline({ orderId }: { orderId: string }) {
  const { data: history, isLoading } = useOrderStatusHistory(orderId);
  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando...</p>;
  if (!history?.length) return <p className="text-sm text-muted-foreground">Nenhum histórico encontrado.</p>;

  return (
    <div className="space-y-3">
      {history.map((h: any) => (
        <div key={h.id} className="flex gap-3 items-start">
          <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
          <div className="flex-1">
            <div className="flex gap-2 items-center flex-wrap">
              {h.from_status && <OrderFlowBadge status={h.from_status} />}
              {h.from_status && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
              <OrderFlowBadge status={h.to_status} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(h.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              {h.changed_by && ` • ${h.changed_by}`}
            </p>
            {h.observation && <p className="text-xs mt-1">{h.observation}</p>}
            {h.block_reason && <p className="text-xs text-destructive mt-1">Motivo: {h.block_reason}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
