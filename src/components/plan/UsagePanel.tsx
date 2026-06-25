import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/base/card';
import { Progress } from '@/ui/base/progress';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Link } from 'react-router-dom';
import { Gauge, Sparkles } from 'lucide-react';
import { useCurrentUsage, METRIC_LABELS } from '@/hooks/system/useUsage';

export function UsagePanel() {
  const { data: usage = [], isLoading } = useCurrentUsage();

  const hasOverLimit = usage.some(
    (u) => u.limit_value && u.limit_value > 0 && u.current_value >= u.limit_value,
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary" />
            Consumo do mês
          </CardTitle>
          <CardDescription>
            Acompanhe os limites do seu plano em tempo real.
          </CardDescription>
        </div>
        {hasOverLimit && (
          <Button asChild size="sm" variant="default">
            <Link to="/upgrade">
              <Sparkles className="mr-1 h-4 w-4" /> Upgrade
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        )}
        {!isLoading && usage.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum consumo registrado neste período.
          </p>
        )}
        {usage.map((u) => {
          const label = METRIC_LABELS[u.metric] ?? u.metric;
          const limit = u.limit_value ?? 0;
          const pct = limit > 0 ? Math.min(u.usage_percent, 100) : 0;
          const exceeded = limit > 0 && u.current_value >= limit;
          const warn = limit > 0 && pct >= 80 && !exceeded;
          return (
            <div key={u.metric} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{label}</span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  {u.current_value.toLocaleString('pt-BR')}{' '}
                  {limit > 0
                    ? `/ ${limit.toLocaleString('pt-BR')}`
                    : '/ ilimitado'}
                  {exceeded && <Badge variant="destructive">Limite atingido</Badge>}
                  {warn && <Badge variant="secondary">Atenção</Badge>}
                </span>
              </div>
              {limit > 0 && <Progress value={pct} className="h-2" />}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
