import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Progress } from '@/ui/base/progress';
import { Badge } from '@/ui/base/badge';
import { Skeleton } from '@/ui/base/skeleton';
import { EmptyState } from '@/shared/components/EmptyState';
import { formatBRL } from '@/lib/formatters';
import { useSalesTargets } from '@/hooks/commercial/useSalesTargets';
import type { DbOrder } from '@/hooks/commercial/useOrders';
import { Crown, Medal, Trophy } from 'lucide-react';

interface Props {
  orders: DbOrder[];
  reps: Array<{ id: string; name: string }>;
}

const medalIcon = (i: number) => {
  if (i === 0) return <Crown className="h-4 w-4 text-yellow-500" />;
  if (i === 1) return <Trophy className="h-4 w-4 text-slate-400" />;
  if (i === 2) return <Medal className="h-4 w-4 text-amber-700" />;
  return <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>;
};

export function SalesTargetsRanking({ orders, reps }: Props) {
  const { data: targets = [], isLoading } = useSalesTargets({ entityType: 'sales_rep' });

  const ranking = useMemo(() => {
    const achievedByRep = new Map<string, number>();
    orders.forEach((o) => {
      if (o.status === 'cancelled' || !o.sales_rep_id) return;
      achievedByRep.set(o.sales_rep_id, (achievedByRep.get(o.sales_rep_id) || 0) + Number(o.total || 0));
    });

    const targetByRep = new Map<string, number>();
    (targets as any[]).forEach((t) => {
      if (!t.entity_id || t.target_type !== 'revenue') return;
      targetByRep.set(t.entity_id, (targetByRep.get(t.entity_id) || 0) + Number(t.target_value || 0));
    });

    return reps
      .map((r) => {
        const achieved = achievedByRep.get(r.id) || 0;
        const target = targetByRep.get(r.id) || 0;
        const pct = target > 0 ? (achieved / target) * 100 : 0;
        return { ...r, achieved, target, pct };
      })
      .filter((r) => r.achieved > 0 || r.target > 0)
      .sort((a, b) => b.achieved - a.achieved);
  }, [orders, targets, reps]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Metas & Ranking</CardTitle>
        <p className="text-xs text-muted-foreground">Faturamento vs meta por vendedor no período selecionado</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : ranking.length === 0 ? (
          <EmptyState title="Sem dados de vendedores" description="Cadastre metas em /comercial/metas ou registre pedidos com vendedor." />
        ) : (
          <div className="space-y-3">
            {ranking.map((r, i) => {
              const status =
                r.pct >= 100 ? { label: 'Meta batida', variant: 'default' as const }
                : r.pct >= 70 ? { label: 'No ritmo', variant: 'secondary' as const }
                : r.target === 0 ? { label: 'Sem meta', variant: 'outline' as const }
                : { label: 'Abaixo', variant: 'destructive' as const };
              return (
                <div key={r.id} className="rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      {medalIcon(i)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold">{r.name}</p>
                        <Badge variant={status.variant} className="text-[10px]">{status.label}</Badge>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatBRL(r.achieved)} {r.target > 0 && <>/ {formatBRL(r.target)}</>}</span>
                        <span className="font-semibold">{r.pct.toFixed(0)}%</span>
                      </div>
                      <Progress value={Math.min(r.pct, 100)} className="mt-2 h-1.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
