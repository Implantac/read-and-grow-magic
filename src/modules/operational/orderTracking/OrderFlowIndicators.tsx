import { Badge } from '@/ui/base/badge';
import { cn } from '@/lib/utils';
import { XCircle } from 'lucide-react';
import { getOrderFlowStatus } from '@/hooks/commercial/useOrderFlow';
import { ORDER_FLOW_STEPS, getFlowStepIndex } from '@/lib/orderFlowEngine';

export function OrderFlowBadge({ status }: { status: string }) {
  const s = getOrderFlowStatus(status);
  return <Badge variant="outline" className={cn('font-medium border', s.color)}>{s.label}</Badge>;
}

export function OrderProgressBar({ status }: { status: string }) {
  const currentIdx = getFlowStepIndex(status);
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-1">
        <XCircle className="h-4 w-4 text-destructive" />
        <span className="text-xs text-destructive font-medium">Cancelado</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 w-full">
      {ORDER_FLOW_STEPS.map((step, idx) => (
        <div key={step.key} className="flex items-center gap-1 flex-1">
          <div className={cn('h-2 flex-1 rounded-full transition-colors', idx <= currentIdx ? 'bg-primary' : 'bg-muted')} />
        </div>
      ))}
    </div>
  );
}
