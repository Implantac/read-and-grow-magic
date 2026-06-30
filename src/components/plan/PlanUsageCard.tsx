import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Progress } from '@/ui/base/progress';
import { Button } from '@/ui/base/button';
import { Link } from 'react-router-dom';
import { useUsageSummary, labelForMetric, type UsageMetric } from '@/hooks/system/useUsageSummary';

function statusOf(percent: number, limit: number): 'unlimited' | 'ok' | 'warn' | 'block' {
  if (limit <= 0) return 'unlimited';
  if (percent >= 100) return 'block';
  if (percent >= 80) return 'warn';
  return 'ok';
}

function MetricRow({ m }: { m: UsageMetric }) {
  const s = statusOf(m.percent, m.limit_value);
  const barTone =
    s === 'block' ? '[&>div]:bg-destructive' : s === 'warn' ? '[&>div]:bg-amber-500' : '[&>div]:bg-primary';
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-foreground">{labelForMetric(m.metric)}</span>
        <span className="tabular-nums text-muted-foreground">
          {m.current_value.toLocaleString('pt-BR')}
          {m.limit_value > 0 ? ` / ${m.limit_value.toLocaleString('pt-BR')}` : ' / ∞'}
        </span>
      </div>
      {m.limit_value > 0 ? (
        <Progress
          value={Math.min(m.percent, 100)}
          className={`h-2 ${barTone}`}
          aria-label={`${labelForMetric(m.metric)}: ${m.percent}% usado`}
        />
      ) : (
        <div className="text-xs text-muted-foreground">Sem limite no plano atual</div>
      )}
    </div>
  );
}

export function PlanUsageCard() {
  const { data, isLoading } = useUsageSummary();

  const anyBlocked = (data ?? []).some((m) => m.limit_value > 0 && m.percent >= 100);
  const anyWarn = (data ?? []).some((m) => m.limit_value > 0 && m.percent >= 80 && m.percent < 100);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Uso do plano</CardTitle>
        {anyBlocked ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
            <AlertTriangle className="h-3 w-3" aria-hidden="true" /> Limite atingido
          </span>
        ) : anyWarn ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-3 w-3" aria-hidden="true" /> Atenção
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Saudável
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div role="status" className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
            <span className="sr-only">Carregando uso do plano</span>
          </div>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados de uso ainda. A apuração ocorre diariamente.</p>
        ) : (
          <>
            {data.map((m) => (
              <MetricRow key={m.metric} m={m} />
            ))}
            {(anyBlocked || anyWarn) && (
              <Button asChild variant={anyBlocked ? 'destructive' : 'default'} size="sm" className="w-full">
                <Link to="/upgrade">Fazer upgrade do plano</Link>
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
