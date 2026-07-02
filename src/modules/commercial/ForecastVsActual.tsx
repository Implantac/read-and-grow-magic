import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { AlertTriangle, TrendingUp, Target, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Progress } from '@/ui/base/progress';
import { Input } from '@/ui/base/input';
import { Skeleton } from '@/ui/base/skeleton';
import { EmptyState } from '@/shared/components/EmptyState';
import { formatBRL } from '@/lib/formatters';
import { useForecastCalculation } from '@/hooks/commercial/useSalesForecasts';
import { useSalesTargets } from '@/hooks/commercial/useSalesTargets';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';

type Rep = { id: string; name: string };

interface Props {
  reps: Rep[];
}

const currentMonth = () => format(new Date(), 'yyyy-MM');

type RepRow = {
  id: string;
  name: string;
  target: number;
  realized: number;
  forecast: number;
  gap: number;
  attainmentPct: number;
  forecastPct: number;
  status: 'meta_batida' | 'no_ritmo' | 'em_risco' | 'critico' | 'sem_meta';
};

function classifyRep(target: number, realized: number, forecast: number): RepRow['status'] {
  if (target <= 0) return 'sem_meta';
  const forecastPct = (forecast / target) * 100;
  if (realized >= target) return 'meta_batida';
  if (forecastPct >= 100) return 'no_ritmo';
  if (forecastPct >= 75) return 'em_risco';
  return 'critico';
}

const statusMeta: Record<RepRow['status'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  meta_batida: { label: 'Meta batida', variant: 'default', className: 'bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/20' },
  no_ritmo: { label: 'No ritmo', variant: 'default', className: 'bg-sky-500/15 text-sky-500 hover:bg-sky-500/20' },
  em_risco: { label: 'Em risco', variant: 'secondary', className: 'bg-amber-500/15 text-amber-500 hover:bg-amber-500/20' },
  critico: { label: 'Crítico', variant: 'destructive', className: '' },
  sem_meta: { label: 'Sem meta', variant: 'outline', className: '' },
};

export function ForecastVsActual({ reps }: Props) {
  const [period, setPeriod] = useState<string>(currentMonth());

  const { data: forecast, isLoading: lf } = useForecastCalculation(period);
  const { data: targets = [], isLoading: lt } = useSalesTargets({ period, entityType: 'sales_rep' });

  const loading = lf || lt;

  const repIndex = useMemo(() => {
    const m = new Map<string, string>();
    reps.forEach((r) => m.set(r.id, r.name));
    return m;
  }, [reps]);

  const rows: RepRow[] = useMemo(() => {
    if (!forecast) return [];
    const byRepMap = new Map<string, { confirmed: number; weighted: number; name: string }>();
    forecast.byRep.forEach((r) => {
      byRepMap.set(r.id, { confirmed: r.confirmed, weighted: r.weighted, name: r.name || repIndex.get(r.id) || 'Sem nome' });
    });
    const targetMap = new Map<string, number>();
    (targets as any[]).forEach((t) => {
      const key = t.entity_id as string;
      if (!key) return;
      targetMap.set(key, (targetMap.get(key) || 0) + Number(t.target_value || 0));
    });

    // Merge all keys (reps that have activity OR meta)
    const allIds = new Set<string>([...byRepMap.keys(), ...targetMap.keys()]);
    const list: RepRow[] = [];
    allIds.forEach((id) => {
      const activity = byRepMap.get(id) || { confirmed: 0, weighted: 0, name: repIndex.get(id) || 'Sem nome' };
      const target = targetMap.get(id) || 0;
      const realized = activity.confirmed;
      const forecastValue = activity.confirmed + activity.weighted;
      const gap = target - forecastValue;
      const attainmentPct = target > 0 ? (realized / target) * 100 : 0;
      const forecastPct = target > 0 ? (forecastValue / target) * 100 : 0;
      list.push({
        id,
        name: activity.name,
        target,
        realized,
        forecast: forecastValue,
        gap,
        attainmentPct,
        forecastPct,
        status: classifyRep(target, realized, forecastValue),
      });
    });
    return list.sort((a, b) => b.forecast - a.forecast);
  }, [forecast, targets, repIndex]);

  const totals = useMemo(() => {
    const target = rows.reduce((s, r) => s + r.target, 0);
    const realized = rows.reduce((s, r) => s + r.realized, 0);
    const forecastValue = rows.reduce((s, r) => s + r.forecast, 0);
    const gap = target - forecastValue;
    const attainment = target > 0 ? (realized / target) * 100 : 0;
    const forecastPct = target > 0 ? (forecastValue / target) * 100 : 0;
    const atRisk = rows.filter((r) => r.status === 'em_risco' || r.status === 'critico').length;
    return { target, realized, forecast: forecastValue, gap, attainment, forecastPct, atRisk };
  }, [rows]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const noData = rows.length === 0;

  const chartData = rows.slice(0, 12).map((r) => ({
    name: r.name.length > 14 ? r.name.slice(0, 12) + '…' : r.name,
    Meta: r.target,
    Realizado: r.realized,
    Forecast: r.forecast,
  }));

  return (
    <div className="space-y-4">
      {/* Header + filtro */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Forecast IA × Realizado</h3>
          <span className="text-xs text-muted-foreground">
            baseado em pipeline ponderado + pedidos confirmados
          </span>
        </div>
        <Input
          type="month"
          value={period}
          onChange={(e) => setPeriod(e.target.value || currentMonth())}
          className="h-9 w-44"
        />
      </div>

      {/* KPIs consolidados */}
      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardHeader className="p-3 pb-1"><CardTitle className="text-xs font-medium text-muted-foreground">Meta do período</CardTitle></CardHeader>
          <CardContent className="p-3 pt-1">
            <p className="text-xl font-bold">{formatBRL(totals.target)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground flex items-center gap-1">
              <Target className="h-3 w-3" /> {rows.filter(r => r.target > 0).length} vendedores com meta
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-1"><CardTitle className="text-xs font-medium text-muted-foreground">Realizado</CardTitle></CardHeader>
          <CardContent className="p-3 pt-1">
            <p className="text-xl font-bold">{formatBRL(totals.realized)}</p>
            <div className="mt-1">
              <Progress value={Math.min(totals.attainment, 100)} className="h-1.5" />
              <p className="mt-1 text-[11px] text-muted-foreground">{totals.attainment.toFixed(1)}% da meta</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-1"><CardTitle className="text-xs font-medium text-muted-foreground">Forecast IA</CardTitle></CardHeader>
          <CardContent className="p-3 pt-1">
            <p className="text-xl font-bold">{formatBRL(totals.forecast)}</p>
            <p className="mt-1 text-[11px] flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="h-3 w-3" /> {totals.forecastPct.toFixed(1)}% projeção do período
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-1"><CardTitle className="text-xs font-medium text-muted-foreground">Gap projetado</CardTitle></CardHeader>
          <CardContent className="p-3 pt-1">
            <p className={`text-xl font-bold ${totals.gap > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
              {totals.gap > 0 ? `-${formatBRL(totals.gap)}` : `+${formatBRL(Math.abs(totals.gap))}`}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> {totals.atRisk} vendedor{totals.atRisk === 1 ? '' : 'es'} em risco
            </p>
          </CardContent>
        </Card>
      </div>

      {noData ? (
        <EmptyState
          title="Sem dados de forecast no período"
          description="Cadastre metas em Metas de Vendas e registre pipeline/pedidos para o mês selecionado."
        />
      ) : (
        <>
          {/* Gráfico */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Comparativo por Vendedor</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatBRL(v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <ReferenceLine y={0} stroke="hsl(var(--border))" />
                  <Bar dataKey="Meta" fill="hsl(var(--muted-foreground))" opacity={0.4} />
                  <Bar dataKey="Realizado" fill="hsl(var(--primary))" />
                  <Bar dataKey="Forecast" fill="hsl(var(--chart-4))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tabela detalhada */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Detalhamento por Vendedor</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {rows.map((r) => {
                  const meta = statusMeta[r.status];
                  return (
                    <div key={r.id} className="grid grid-cols-12 items-center gap-3 px-4 py-3 hover:bg-muted/30 transition">
                      <div className="col-span-3 min-w-0">
                        <p className="truncate text-sm font-medium">{r.name}</p>
                        <Badge variant={meta.variant} className={`mt-1 text-[10px] ${meta.className}`}>
                          {meta.label}
                        </Badge>
                      </div>
                      <div className="col-span-2 text-right">
                        <p className="text-[10px] uppercase text-muted-foreground">Meta</p>
                        <p className="text-sm font-semibold">{formatBRL(r.target)}</p>
                      </div>
                      <div className="col-span-2 text-right">
                        <p className="text-[10px] uppercase text-muted-foreground">Realizado</p>
                        <p className="text-sm font-semibold">{formatBRL(r.realized)}</p>
                      </div>
                      <div className="col-span-2 text-right">
                        <p className="text-[10px] uppercase text-muted-foreground">Forecast IA</p>
                        <p className="text-sm font-semibold text-primary">{formatBRL(r.forecast)}</p>
                      </div>
                      <div className="col-span-3">
                        {r.target > 0 ? (
                          <>
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                              <span>{r.forecastPct.toFixed(0)}% projetado</span>
                              <span className={r.gap > 0 ? 'text-amber-500' : 'text-emerald-500'}>
                                {r.gap > 0
                                  ? <><XCircle className="inline h-3 w-3 mr-0.5" />-{formatBRL(r.gap)}</>
                                  : <><CheckCircle2 className="inline h-3 w-3 mr-0.5" />+{formatBRL(Math.abs(r.gap))}</>}
                              </span>
                            </div>
                            <Progress
                              value={Math.min(r.forecastPct, 100)}
                              className={`mt-1 h-1.5 ${r.status === 'critico' ? '[&>div]:bg-destructive' : r.status === 'em_risco' ? '[&>div]:bg-amber-500' : ''}`}
                            />
                          </>
                        ) : (
                          <p className="text-[11px] text-muted-foreground italic">Sem meta cadastrada</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
