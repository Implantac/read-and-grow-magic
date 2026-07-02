import { ShieldCheck, ShieldAlert, ShieldX, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import type { CreditCheckResult } from '@/hooks/commercial/useCreditCheck';

interface Props {
  result?: CreditCheckResult | null;
  loading?: boolean;
  onRequestApproval?: () => void;
  className?: string;
}

const brl = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

export function CreditBadge({ result, loading, onRequestApproval, className }: Props) {
  if (loading) {
    return (
      <div className={cn('flex items-center gap-2 text-xs text-muted-foreground', className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        Analisando crédito...
      </div>
    );
  }
  if (!result) return null;

  const Icon = result.approved ? ShieldCheck : result.profile_status === 'blocked' ? ShieldX : ShieldAlert;
  const tone = result.approved
    ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/5'
    : result.profile_status === 'blocked'
    ? 'text-red-500 border-red-500/30 bg-red-500/5'
    : 'text-amber-500 border-amber-500/30 bg-amber-500/5';

  return (
    <Card className={cn('p-3 border', tone, className)}>
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-sm font-semibold">
            {result.approved ? 'Crédito aprovado' : result.blocked_reason || 'Crédito insuficiente'}
          </p>
          <p className="text-xs opacity-80">
            Disponível: <span className="font-medium">{brl(result.available_limit)}</span>
            {' · '}Limite: {brl(result.credit_limit)}
            {' · '}A receber: {brl(result.ar_open)}
          </p>
          {!result.approved && onRequestApproval && (
            <button
              type="button"
              onClick={onRequestApproval}
              className="text-xs underline underline-offset-2 hover:opacity-80"
            >
              Solicitar aprovação
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
