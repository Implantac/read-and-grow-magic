import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Progress } from '@/ui/base/progress';
import { Skeleton } from '@/ui/base/skeleton';
import { AlertTriangle, CheckCircle2, Gauge, TrendingUp } from 'lucide-react';
import { useCurrentUsage, METRIC_LABELS, type UsageRow } from '@/hooks/system/useUsage';

type Level = 'ok' | 'warn' | 'critical' | 'blocked';

function classify(pct: number): Level {
  if (pct >= 100) return 'blocked';
  if (pct >= 95) return 'critical';
  if (pct >= 80) return 'warn';
  return 'ok';
}

const LEVEL_STYLES: Record<Level, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ComponentType<{ className?: string }> }> = {
  ok:       { label: 'OK',          variant: 'outline',      icon: CheckCircle2 },
  warn:     { label: 'Atenção 80%', variant: 'secondary',    icon: TrendingUp },
  critical: { label: 'Crítico 95%', variant: 'destructive',  icon: AlertTriangle },
  blocked:  { label: 'Bloqueado',   variant: 'destructive',  icon: AlertTriangle },
};

function project(row: UsageRow): number {
  const now = new Date();
  const day = now.getUTCDate();
  const daysInMonth = new Date(now.getUTCFullYear(), now.getUTCMonth() + 1, 0).getUTCDate();
  if (day <= 0) return row.current_value;
  return Math.round((row.current_value / day) * daysInMonth);
}

export function QuotaPanel() {
  const { data, isLoading } = useCurrentUsage();

  const rows = useMemo(() => (data ?? []).filter(r => r.limit_value != null && r.limit_value > 0), [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-5 w-5" /> Quotas do plano · mês corrente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma quota ativa neste plano.</p>
        ) : rows.map(r => {
          const pct = Math.min(100, Number(r.usage_percent || 0));
          const level = classify(pct);
          const cfg = LEVEL_STYLES[level];
          const Icon = cfg.icon;
          const projected = project(r);
          const projectedPct = r.limit_value ? Math.round((projected / r.limit_value) * 100) : 0;
          return (
            <div key={r.metric} className="space-y-2 border rounded-lg p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium">{METRIC_LABELS[r.metric] || r.metric}</div>
                <Badge variant={cfg.variant} className="gap-1">
                  <Icon className="h-3 w-3" /> {cfg.label}
                </Badge>
              </div>
              <Progress value={pct} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{r.current_value.toLocaleString('pt-BR')} / {r.limit_value?.toLocaleString('pt-BR')} ({pct}%)</span>
                <span>Projeção do mês: {projected.toLocaleString('pt-BR')} ({projectedPct}%)</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
