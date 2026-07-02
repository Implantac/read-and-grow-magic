import { CheckCircle2, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/ui/base/tooltip';
import { cn } from '@/lib/utils';
import type { AtpCheckResult, AtpStatus } from '@/hooks/commercial/useAtpCheck';

interface Props {
  result?: AtpCheckResult | null;
  loading?: boolean;
  className?: string;
}

const styles: Record<AtpStatus, string> = {
  green: 'text-emerald-500',
  amber: 'text-amber-500',
  red: 'text-red-500',
};

const labels: Record<AtpStatus, string> = {
  green: 'Disponível agora',
  amber: 'Disponível em breve',
  red: 'Sem disponibilidade',
};

export function AtpBadge({ result, loading, className }: Props) {
  if (loading) {
    return <Loader2 className={cn('h-4 w-4 animate-spin text-muted-foreground', className)} />;
  }
  if (!result) return null;

  const Icon = result.status === 'green' ? CheckCircle2 : result.status === 'amber' ? AlertTriangle : XCircle;

  const tooltip = (
    <div className="space-y-1 text-xs">
      <p className="font-semibold">{labels[result.status]}</p>
      <p>Em estoque: {result.on_hand}</p>
      <p>Reservado: {result.reserved}</p>
      <p>Disponível: {result.available}</p>
      {result.incoming > 0 && (
        <p>
          A chegar: {result.incoming}
          {result.next_incoming_date && ` · ${new Date(result.next_incoming_date).toLocaleDateString('pt-BR')}`}
        </p>
      )}
      <p className="pt-1 border-t border-border">Solicitado: {result.requested}</p>
    </div>
  );

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn('inline-flex items-center', className)}>
            <Icon className={cn('h-4 w-4', styles[result.status])} aria-label={labels[result.status]} />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
