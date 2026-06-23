import { CheckCircle, XCircle } from 'lucide-react';
import { getOrderStatusLabel } from '@/config/commercial';
import { statusSteps } from './constants';

export function OrderStatusTimeline({ currentStatus }: { currentStatus: string }) {
  if (currentStatus === 'cancelled') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
        <XCircle className="h-5 w-5 text-destructive" />
        <span className="text-sm font-medium text-destructive">Pedido Cancelado</span>
      </div>
    );
  }

  const currentIdx = statusSteps.indexOf(currentStatus);

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      {statusSteps.map((step, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        return (
          <div key={step} className="flex items-center gap-1">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  isCompleted
                    ? 'bg-primary text-primary-foreground'
                    : isCurrent
                    ? 'bg-primary/20 text-primary ring-2 ring-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? <CheckCircle className="h-4 w-4" /> : idx + 1}
              </div>
              <span
                className={`text-[10px] whitespace-nowrap ${
                  isCurrent ? 'font-semibold text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {getOrderStatusLabel(step as any)}
              </span>
            </div>
            {idx < statusSteps.length - 1 && (
              <div
                className={`mx-0.5 h-0.5 w-4 shrink-0 rounded-full transition-colors ${
                  idx < currentIdx ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
