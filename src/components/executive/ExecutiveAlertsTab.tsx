import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ShieldAlert, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { fmt } from './ExecutiveKPICards';
import type { ExecutiveKPIs, ExecutiveAlert } from '@/hooks/ai/useExecutiveAI';

const severityColor: Record<string, string> = {
  critical: 'bg-destructive text-destructive-foreground',
  high: 'bg-orange-500/20 text-orange-700 dark:text-orange-400',
  medium: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
  low: 'bg-muted text-muted-foreground',
};

const alertSeverityBorder: Record<string, string> = {
  critical: 'border-l-destructive',
  high: 'border-l-orange-500',
  medium: 'border-l-blue-500',
  low: 'border-l-muted-foreground',
};

function RiskItem({ label, value, threshold, current }: { label: string; value: string; threshold: number; current: number }) {
  const pct = Math.min(100, (current / threshold) * 100);
  const color = pct >= 100 ? 'bg-destructive' : pct >= 70 ? 'bg-orange-500' : 'bg-emerald-500';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

interface Props {
  kpis: ExecutiveKPIs | undefined;
  alerts: ExecutiveAlert[];
}

export function ExecutiveAlertsTab({ kpis, alerts }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-destructive" />Painel de Riscos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RiskItem label="Inadimplência" value={`${kpis?.defaultRate || 0}%`} threshold={10} current={kpis?.defaultRate || 0} />
            <RiskItem label="Concentração Top3" value={`${kpis?.concentrationPct || 0}%`} threshold={50} current={kpis?.concentrationPct || 0} />
            <RiskItem label="Produtos Críticos" value={`${kpis?.lowStockProducts || 0}`} threshold={5} current={kpis?.lowStockProducts || 0} />
            <RiskItem label="Vencidos a Pagar" value={fmt(kpis?.overduePayable || 0)} threshold={10000} current={kpis?.overduePayable || 0} />
            <RiskItem label="Clientes em Risco" value={`${kpis?.clientsAtRisk || 0}`} threshold={10} current={kpis?.clientsAtRisk || 0} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4 text-primary" />Fluxo de Caixa Projetado (30d)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-emerald-500/10 p-4 text-center">
                <ArrowDownRight className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Entradas</p>
                <p className="text-lg font-bold">{fmt(kpis?.futureReceivables || 0)}</p>
              </div>
              <div className="rounded-lg bg-destructive/10 p-4 text-center">
                <ArrowUpRight className="h-5 w-5 text-destructive mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Saídas</p>
                <p className="text-lg font-bold">{fmt(kpis?.futurePayables || 0)}</p>
              </div>
            </div>
            <div className={cn('rounded-lg p-4 text-center', (kpis?.cashFlowProjection30d || 0) >= 0 ? 'bg-emerald-500/10' : 'bg-destructive/10')}>
              <p className="text-xs text-muted-foreground">Saldo Projetado</p>
              <p className="text-2xl font-bold">{fmt(kpis?.cashFlowProjection30d || 0)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {alerts.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {alerts.map((alert: any) => (
            <Card key={alert.id} className={cn('border-l-4', alertSeverityBorder[alert.severity] || 'border-l-muted')}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-sm font-medium">{alert.title}</p>
                  <Badge className={cn('text-[10px]', severityColor[alert.severity])}>{alert.severity}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{alert.description}</p>
                {alert.metric_name && <p className="text-xs mt-1">📊 {alert.metric_name}: {alert.metric_value}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">Nenhum alerta ativo no momento</CardContent></Card>
      )}
    </div>
  );
}
