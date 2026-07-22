import { useMemo, useState } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Skeleton } from '@/ui/base/skeleton';
import { useOrders } from '@/hooks/commercial/useOrders';
import { useLowMarginAlerts, useResolveAlert, useResolveAlertsBulk } from '@/hooks/commercial/useLowMarginAlerts';
import { AlertTriangle, TrendingUp, TrendingDown, Percent, DollarSign, Download } from 'lucide-react';
import { PERIODS, fmtBRL, exportCSV } from './margin-analytics/utils';
import { useMarginAnalytics } from './margin-analytics/useMarginAnalytics';
import { AlertsPanel } from './margin-analytics/AlertsPanel';
import { MarginTrendChart } from './margin-analytics/MarginTrendChart';
import { Row, OrderRow, DimensionRow } from './margin-analytics/rows';

export default function MarginAnalytics() {
  const { data: allOrders, isLoading } = useOrders();
  const { data: alerts } = useLowMarginAlerts();
  const resolveAlert = useResolveAlert();
  const resolveBulk = useResolveAlertsBulk();

  const [period, setPeriod] = useState<string>('30');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const filteredAlerts = useMemo(
    () => (alerts ?? []).filter((a) => severityFilter === 'all' || a.severity === severityFilter),
    [alerts, severityFilter],
  );

  const { orders, analytics, trend } = useMarginAnalytics(allOrders, period);

  return (
    <PageContainer>
      <PageHeader
        title="Rentabilidade dos Pedidos"
        description="Snapshot de margem estimada (CMV + impostos) capturado no momento da criação do pedido."
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(PERIODS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          disabled={!orders || orders.length === 0}
          onClick={() => {
            const rows = (orders ?? []).map((o) => ({
              numero: o.number,
              data: String(o.date).slice(0, 10),
              cliente: o.client_name,
              vendedor: o.sales_rep_name ?? '',
              receita: Number(o.total || 0).toFixed(2),
              custo_estimado: Number(o.estimated_cost ?? 0).toFixed(2),
              imposto_estimado: Number(o.estimated_tax ?? 0).toFixed(2),
              margem_pct: o.estimated_margin_pct !== null && o.estimated_margin_pct !== undefined
                ? Number(o.estimated_margin_pct).toFixed(2)
                : '',
              status: o.status,
            }));
            exportCSV(rows, `rentabilidade_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
          }}
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {alerts && alerts.length > 0 && (
        <AlertsPanel
          alerts={alerts}
          filteredAlerts={filteredAlerts}
          severityFilter={severityFilter}
          setSeverityFilter={setSeverityFilter}
          resolveAlert={resolveAlert}
          resolveBulk={resolveBulk}
        />
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : !analytics ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Nenhum pedido com snapshot de rentabilidade encontrado.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KPICard title="Margem Média Estimada" value={`${analytics.avgMargin.toFixed(1)}%`} icon={Percent} />
            <KPICard title="Receita Total" value={fmtBRL(analytics.totalRevenue)} icon={DollarSign} />
            <KPICard title="CMV Estimado" value={fmtBRL(analytics.totalCost)} icon={TrendingDown} />
            <KPICard title="Impostos Estimados" value={fmtBRL(analytics.totalTax)} icon={Percent} />
          </div>

          <MarginTrendChart trend={trend} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Distribuição por Semáforo</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Row label="Saudável (≥20%)" count={analytics.green} total={analytics.snapCount} tone="emerald" />
                <Row label="Aceitável (8-20%)" count={analytics.yellow} total={analytics.snapCount} tone="yellow" />
                <Row label="Crítica (<8%)" count={analytics.red} total={analytics.snapCount} tone="red" />
                {analytics.withoutCost.length > 0 && (
                  <div className="flex items-start gap-2 rounded-md border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm text-yellow-500">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{analytics.withoutCost.length} pedido(s) sem custo cadastrado — margem não confiável.</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Top 5 — Maior Margem
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analytics.top.map((o) => (
                  <OrderRow key={o.id} number={o.number} client={o.client_name} total={Number(o.total)} margin={Number(o.estimated_margin_pct)} />
                ))}
                {analytics.top.length === 0 && <p className="text-sm text-muted-foreground">Sem dados.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  Bottom 5 — Menor Margem
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analytics.bottom.map((o) => (
                  <OrderRow key={o.id} number={o.number} client={o.client_name} total={Number(o.total)} margin={Number(o.estimated_margin_pct)} />
                ))}
                {analytics.bottom.length === 0 && <p className="text-sm text-muted-foreground">Sem dados.</p>}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Rentabilidade por Vendedor</CardTitle></CardHeader>
              <CardContent>
                {analytics.bySalesRep.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum vendedor identificado nos pedidos com snapshot.</p>
                ) : (
                  <div className="space-y-2">
                    {analytics.bySalesRep.map((r) => (
                      <DimensionRow key={r.key} label={r.key} revenue={r.revenue} margin={r.avgMargin} count={r.count} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Top Clientes por Receita</CardTitle></CardHeader>
              <CardContent>
                {analytics.byClient.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem dados.</p>
                ) : (
                  <div className="space-y-2">
                    {analytics.byClient.map((r) => (
                      <DimensionRow key={r.key} label={r.key} revenue={r.revenue} margin={r.avgMargin} count={r.count} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </PageContainer>
  );
}
