import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, AlertTriangle, TrendingUp, RefreshCw, Activity, Wallet, AlertCircle } from 'lucide-react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { useLatestHealthScore, usePredictiveAlerts, useComputeIntelligence, useAutoReconcile } from '@/hooks/financial/useFinancialIntelligence';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatBRL } from '@/lib/formatters';

const gradeColor: Record<string, string> = {
  A: 'bg-success text-success-foreground',
  B: 'bg-success/70 text-success-foreground',
  C: 'bg-warning text-warning-foreground',
  D: 'bg-destructive/70 text-destructive-foreground',
  E: 'bg-destructive text-destructive-foreground',
};

const sevColor: Record<string, 'destructive' | 'default' | 'secondary' | 'outline'> = {
  critical: 'destructive', high: 'destructive', medium: 'default', low: 'secondary',
};

export default function FinancialIntelligence() {
  const { data: score } = useLatestHealthScore();
  const { data: alerts = [] } = usePredictiveAlerts();
  const compute = useComputeIntelligence();
  const reconcile = useAutoReconcile();

  return (
    <PageContainer>
      <PageHeader title="Inteligência Financeira" description="Score de saúde, previsão de caixa e conciliação automática com IA">
        <Button variant="outline" size="sm" onClick={() => reconcile.mutate()} disabled={reconcile.isPending} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Conciliar extrato
        </Button>
        <Button size="sm" onClick={() => compute.mutate()} disabled={compute.isPending} className="gap-2">
          <Brain className="h-4 w-4" /> Recalcular IA
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="md:col-span-1">
          <CardContent className="p-6 text-center">
            <div className={`inline-flex items-center justify-center h-24 w-24 rounded-full text-4xl font-bold mb-3 ${gradeColor[score?.score_grade ?? 'C']}`}>
              {score?.score_grade ?? '—'}
            </div>
            <div className="text-3xl font-bold">{score?.score_total ?? '—'}<span className="text-sm text-muted-foreground">/100</span></div>
            <div className="text-xs text-muted-foreground mt-1">Score de Saúde Financeira</div>
            {score && <div className="text-xs text-muted-foreground mt-2">Atualizado: {format(new Date(score.created_at), 'dd/MM HH:mm', { locale: ptBR })}</div>}
          </CardContent>
        </Card>

        <KPICard title="Caixa para" value={`${score?.cash_runway_days ?? '—'} dias`} subtitle="autonomia projetada" icon={<Wallet className="h-5 w-5" />} accentColor={(score?.cash_runway_days ?? 0) < 30 ? 'danger' : 'success'} index={0} />
        <KPICard title="Liquidez corrente" value={(score?.current_ratio ?? 0).toFixed(2)} subtitle="ativo / passivo CP" icon={<Activity className="h-5 w-5" />} accentColor={(score?.current_ratio ?? 0) < 1 ? 'danger' : 'success'} index={1} />
        <KPICard title="Inadimplência" value={`${(score?.delinquency_rate ?? 0).toFixed(1)}%`} subtitle="contas vencidas" icon={<AlertCircle className="h-5 w-5" />} accentColor={(score?.delinquency_rate ?? 0) > 10 ? 'danger' : 'success'} index={2} />
      </div>

      {score && (
        <Card>
          <CardHeader><CardTitle className="text-base">Decomposição do score</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Liquidez', value: score.liquidity_score },
              { label: 'Inadimplência', value: score.delinquency_score },
              { label: 'Fluxo de caixa', value: score.cashflow_score },
              { label: 'Crescimento', value: score.growth_score },
            ].map(s => (
              <div key={s.label}>
                <div className="flex justify-between text-sm mb-1"><span>{s.label}</span><span className="font-mono">{s.value}/100</span></div>
                <Progress value={s.value} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Alertas preditivos ativos</CardTitle></CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">✅ Nenhum risco detectado nos próximos 30 dias</div>
          ) : (
            <div className="space-y-3">
              {alerts.map(a => (
                <div key={a.id} className="border rounded-lg p-3 flex items-start gap-3">
                  <Badge variant={sevColor[a.severity]} className="uppercase text-[10px]">{a.severity}</Badge>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{a.title}</div>
                    {a.description && <div className="text-xs text-muted-foreground mt-1">{a.description}</div>}
                    {a.predicted_amount != null && (
                      <div className="text-xs mt-2"><span className="text-muted-foreground">Valor projetado: </span><span className="font-mono font-medium">{formatBRL(Number(a.predicted_amount))}</span></div>
                    )}
                    {a.recommended_action && <div className="text-xs text-primary mt-1">→ {a.recommended_action}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {Array.isArray(score?.recommendations) && score!.recommendations.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" />Recomendações da IA</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {score!.recommendations.map((r: any, i: number) => (
                <li key={i} className="text-sm flex gap-2">
                  <Badge variant={r.priority === 'critical' || r.priority === 'high' ? 'destructive' : 'secondary'} className="text-[10px] uppercase">{r.priority}</Badge>
                  <span>{r.msg}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
