import { useState } from 'react';
import { Activity, CheckCircle2, XCircle, Clock, TrendingDown } from 'lucide-react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { PageLoading } from '@/shared/components/PageLoading';
import { KPICard } from '@/shared/components/KPICard';
import { EmptyState } from '@/shared/components/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Progress } from '@/ui/base/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { formatDate } from '@/lib/formatters';
import { useO2CMonitor, O2C_STEPS, type O2CStepKey } from '@/hooks/commercial/useO2CMonitor';

const STEP_LABEL: Record<O2CStepKey, string> = {
  credit: 'Crédito',
  fiscal: 'Fiscal',
  sefaz: 'SEFAZ (NF-e)',
  picking: 'Separação',
  notify: 'Notificação',
};

function fmtMs(ms: number | null) {
  if (ms == null) return '—';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}min`;
}

export default function O2CMonitor() {
  const [windowDays, setWindowDays] = useState(7);
  const { data, isLoading } = useO2CMonitor(windowDays);

  if (isLoading) return <PageLoading />;

  const snapshot = data!;
  const maxCount = Math.max(1, ...snapshot.rows.map((r) => r.ok + r.failed + r.skipped + r.running));
  const successRate = snapshot.totalRuns
    ? Math.round((snapshot.totalCompleted / snapshot.totalRuns) * 100)
    : 0;

  return (
    <PageContainer>
      <PageHeader
        title="Monitor Order-to-Cash"
        description="Funil de execuções do pipeline e tempo médio por etapa"
        icon={Activity}
        actions={
          <Select value={String(windowDays)} onValueChange={(v) => setWindowDays(Number(v))}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Últimas 24h</SelectItem>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Execuções" value={snapshot.totalRuns} icon={Activity} />
        <KPICard title="Concluídas" value={snapshot.totalCompleted} icon={CheckCircle2} />
        <KPICard title="Com falha" value={snapshot.totalFailed} icon={XCircle} />
        <KPICard title="Taxa de sucesso" value={`${successRate}%`} icon={TrendingDown} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Funil por etapa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {O2C_STEPS.map((step) => {
            const row = snapshot.rows.find((r) => r.step === step)!;
            const total = row.ok + row.failed + row.skipped + row.running;
            const percent = Math.round((total / maxCount) * 100);
            return (
              <div key={step} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{STEP_LABEL[step]}</span>
                    <Badge variant="outline" className="text-xs">{total} execuções</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Média {fmtMs(row.avg_ms)}</span>
                    <span className="text-emerald-500">✓ {row.ok}</span>
                    {row.failed > 0 && <span className="text-destructive">✕ {row.failed}</span>}
                    {row.skipped > 0 && <span>⊘ {row.skipped}</span>}
                  </div>
                </div>
                <Progress value={percent} />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Heatmap SEFAZ (falhas por hora)</span>
            <Badge
              variant="outline"
              className={
                snapshot.sefazFailureRate > 0.1
                  ? 'border-destructive/40 text-destructive'
                  : 'border-emerald-500/40 text-emerald-500'
              }
            >
              Taxa {(snapshot.sefazFailureRate * 100).toFixed(1)}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-12 gap-1 sm:grid-cols-24">
            {snapshot.sefazByHour.map((h) => {
              const intensity = h.total === 0
                ? 'bg-muted/40'
                : h.rate >= 0.5
                  ? 'bg-destructive/80'
                  : h.rate >= 0.25
                    ? 'bg-destructive/50'
                    : h.rate >= 0.1
                      ? 'bg-orange-500/60'
                      : 'bg-emerald-500/40';
              return (
                <div
                  key={h.hour}
                  className={`aspect-square rounded ${intensity} flex items-end justify-center text-[9px] font-medium text-foreground/80`}
                  title={`${h.hour}h · ${h.failed}/${h.total} falhas (${(h.rate * 100).toFixed(0)}%)`}
                >
                  {h.hour}
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Cada célula = 1 hora do dia. Intensidade proporcional à taxa de falha SEFAZ na janela selecionada.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 5 rejeições SEFAZ</CardTitle>
          </CardHeader>
          <CardContent>
            {snapshot.topSefazCodes.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="Sem rejeições" description="Nenhuma falha SEFAZ com código na janela." />
            ) : (
              <ul className="space-y-2">
                {snapshot.topSefazCodes.map((c) => (
                  <li key={c.code} className="flex items-start justify-between gap-3 border-b border-border/50 pb-2 last:border-0">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">Código {c.code}</div>
                      {c.suggestion && (
                        <div className="text-xs text-muted-foreground truncate">{c.suggestion}</div>
                      )}
                    </div>
                    <Badge variant="destructive" className="whitespace-nowrap">{c.count}×</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evolução semanal SEFAZ</CardTitle>
          </CardHeader>
          <CardContent>
            {snapshot.sefazByWeek.length === 0 ? (
              <EmptyState icon={Activity} title="Sem dados" description="Sem eventos SEFAZ na janela." />
            ) : (
              <div className="space-y-2">
                {snapshot.sefazByWeek.map((w) => (
                  <div key={w.weekStart} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">Semana de {new Date(w.weekStart).toLocaleDateString('pt-BR')}</span>
                      <span className={w.rate > 0.1 ? 'text-destructive' : 'text-muted-foreground'}>
                        {w.failed}/{w.total} · {(w.rate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={Math.round(w.rate * 100)} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Drill-down por vendedor</CardTitle>
        </CardHeader>
        <CardContent>
          {snapshot.bySeller.length === 0 ? (
            <EmptyState icon={Activity} title="Sem vendedor identificado" description="Nenhum evento com seller_id na janela." />
          ) : (
            <ul className="divide-y divide-border/60">
              {snapshot.bySeller.map((s) => (
                <li key={s.sellerId} className="py-2 flex items-center justify-between gap-3">
                  <div className="text-sm font-mono">{s.sellerId.slice(0, 8)}</div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{s.total} execuções</span>
                    <span className={s.rate > 0.1 ? 'text-destructive font-semibold' : 'text-emerald-500'}>
                      {(s.rate * 100).toFixed(1)}% falha
                    </span>
                  </div>
                </li>
              ))}
            </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Falhas recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {snapshot.recentFailures.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Sem falhas na janela"
              description="Nenhum pipeline O2C falhou no período selecionado."
            />
          ) : (
            <ul className="divide-y divide-border/60">
              {snapshot.recentFailures.map((f, i) => (
                <li key={`${f.orderId}-${i}`} className="py-3 flex items-start gap-3">
                  <XCircle className="h-4 w-4 text-destructive mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">
                      Pedido {f.orderId.slice(0, 8)} · etapa {STEP_LABEL[f.step]}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {f.message ?? 'Sem mensagem'}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(f.at)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
