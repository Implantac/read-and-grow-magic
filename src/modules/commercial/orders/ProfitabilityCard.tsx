import { TrendingDown, TrendingUp, Loader2, Receipt } from 'lucide-react';
import { Card, CardContent } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Separator } from '@/ui/base/separator';
import { formatBRL } from '@/lib/formatters';
import type { OrderProfitability } from '@/hooks/commercial/useOrderProfitability';

interface Props {
  data: OrderProfitability | undefined;
  loading: boolean;
}

export function ProfitabilityCard({ data, loading }: Props) {
  if (loading) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Calculando margem e impostos...
        </CardContent>
      </Card>
    );
  }
  if (!data) return null;

  const marginTone =
    data.marginPct >= 20 ? 'text-emerald-500' :
    data.marginPct >= 8 ? 'text-yellow-500' :
    'text-destructive';
  const Icon = data.marginPct >= 8 ? TrendingUp : TrendingDown;
  const missingCost = data.perLine.some((l) => l.cost === 0 && l.revenue > 0);

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Margem & Impostos (estimado)
            </h4>
          </div>
          <Badge variant="outline" className={`gap-1 ${marginTone}`}>
            <Icon className="h-3 w-3" />
            {data.marginPct.toFixed(1)}%
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <span className="text-muted-foreground">Receita líquida</span>
          <span className="text-right font-medium">{formatBRL(data.net)}</span>
          <span className="text-muted-foreground">CMV</span>
          <span className="text-right">{formatBRL(data.cogs)}</span>
          <span className="text-muted-foreground">Margem bruta</span>
          <span className="text-right">{formatBRL(data.grossMargin)}</span>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <span className="text-muted-foreground">ICMS (18%)</span>
          <span className="text-right">{formatBRL(data.taxes.icms)}</span>
          <span className="text-muted-foreground">PIS (1,65%)</span>
          <span className="text-right">{formatBRL(data.taxes.pis)}</span>
          <span className="text-muted-foreground">COFINS (7,6%)</span>
          <span className="text-right">{formatBRL(data.taxes.cofins)}</span>
          <span className="font-medium">Total de impostos</span>
          <span className="text-right font-medium">{formatBRL(data.taxes.total)}</span>
        </div>

        <Separator />

        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">Resultado líquido</span>
          <span className={`font-bold ${marginTone}`}>{formatBRL(data.netMargin)}</span>
        </div>

        {missingCost && (
          <p className="text-[11px] text-yellow-600 dark:text-yellow-400">
            ⚠ Alguns itens não têm custo cadastrado; margem pode estar superestimada.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
