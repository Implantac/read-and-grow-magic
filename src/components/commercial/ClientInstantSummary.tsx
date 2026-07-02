import { Award, Calendar, CreditCard, Tag, Loader2 } from 'lucide-react';
import { Badge } from '@/ui/base/badge';
import { Card, CardContent } from '@/ui/base/card';
import { formatBRL } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { useClientCommercialProfile, type ClientTier } from '@/hooks/commercial/useClientCommercialProfile';
import { useCreditCheck } from '@/hooks/commercial/useCreditCheck';

const tierMeta: Record<ClientTier, { label: string; className: string }> = {
  bronze:  { label: 'Bronze',   className: 'bg-amber-700/15 text-amber-700 border-amber-700/30' },
  silver:  { label: 'Prata',    className: 'bg-slate-400/15 text-slate-300 border-slate-400/30' },
  gold:    { label: 'Ouro',     className: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30' },
  diamond: { label: 'Diamante', className: 'bg-cyan-400/15 text-cyan-300 border-cyan-400/30' },
};

function daysSince(iso: string | null): string {
  if (!iso) return 'Sem compras';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Ontem';
  return `Há ${days} dias`;
}

interface Props {
  clientId: string | null;
  /** Valor do pedido em construção (para calcular crédito disponível vs consumido). */
  orderAmount?: number;
}

export function ClientInstantSummary({ clientId, orderAmount = 0 }: Props) {
  const profile = useClientCommercialProfile(clientId);
  const credit = useCreditCheck(clientId, orderAmount);

  if (!clientId) return null;

  const isLoading = profile.isLoading || credit.isLoading;
  const p = profile.data;
  const c = credit.data;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="flex flex-wrap items-center gap-3 p-3">
        {isLoading && (
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Analisando perfil comercial...
          </span>
        )}

        {c && (
          <Badge
            variant="outline"
            className={cn(
              'gap-1.5 border',
              c.approved
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500'
                : 'border-red-500/40 bg-red-500/10 text-red-500'
            )}
          >
            <CreditCard className="h-3 w-3" />
            Crédito: {formatBRL(Number(c.available ?? 0))}
          </Badge>
        )}

        {p && (
          <>
            <Badge variant="outline" className={cn('gap-1.5 border', tierMeta[p.tier].className)}>
              <Award className="h-3 w-3" />
              Cliente {tierMeta[p.tier].label}
            </Badge>

            <Badge variant="outline" className="gap-1.5">
              <Calendar className="h-3 w-3" />
              Última compra: {daysSince(p.last_purchase_at)}
            </Badge>

            {p.suggested_price_list_name && (
              <Badge variant="outline" className="gap-1.5">
                <Tag className="h-3 w-3" />
                Tabela sugerida: {p.suggested_price_list_name}
              </Badge>
            )}

            <span className="ml-auto text-xs text-muted-foreground">
              LTV 12m: <strong className="text-foreground">{formatBRL(Number(p.ltv_12m || 0))}</strong>
              <span className="mx-1.5">·</span>
              {p.order_count} pedidos
            </span>
          </>
        )}
      </CardContent>
    </Card>
  );
}
