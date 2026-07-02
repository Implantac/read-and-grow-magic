import { useMemo } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { useOrders } from '@/hooks/commercial/useOrders';
import { MarginBadge } from './orders/MarginBadge';
import { AlertTriangle, TrendingUp, TrendingDown, Percent, DollarSign } from 'lucide-react';
import { Skeleton } from '@/ui/base/skeleton';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

const fmtBRL = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function MarginAnalytics() {
  const { data: orders, isLoading } = useOrders();

  const analytics = useMemo(() => {
    if (!orders || orders.length === 0) return null;

    const withSnap = orders.filter(
      (o) => o.estimated_margin_pct !== null && o.estimated_margin_pct !== undefined,
    );
    const withoutCost = orders.filter(
      (o) => o.estimated_cost === null || o.estimated_cost === undefined || Number(o.estimated_cost) === 0,
    );

    const totalRevenue = orders.reduce((s, o) => s + Number(o.total || 0), 0);
    const totalCost = withSnap.reduce((s, o) => s + Number(o.estimated_cost || 0), 0);
    const totalTax = withSnap.reduce((s, o) => s + Number(o.estimated_tax || 0), 0);
    const avgMargin =
      withSnap.length > 0
        ? withSnap.reduce((s, o) => s + Number(o.estimated_margin_pct || 0), 0) / withSnap.length
        : 0;

    const green = withSnap.filter((o) => Number(o.estimated_margin_pct) >= 20).length;
    const yellow = withSnap.filter(
      (o) => Number(o.estimated_margin_pct) >= 8 && Number(o.estimated_margin_pct) < 20,
    ).length;
    const red = withSnap.filter((o) => Number(o.estimated_margin_pct) < 8).length;

    const sorted = [...withSnap].sort(
      (a, b) => Number(a.estimated_margin_pct) - Number(b.estimated_margin_pct),
    );
    const bottom = sorted.slice(0, 5);
    const top = sorted.slice(-5).reverse();

    return {
      totalRevenue,
      totalCost,
      totalTax,
      avgMargin,
      green,
      yellow,
      red,
      withoutCost,
      top,
      bottom,
      snapCount: withSnap.length,
    };
  }, [orders]);

  const trend = useMemo(() => {
    if (!orders) return [];
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 29);
    const byDay = new Map<string, { sum: number; count: number }>();
    for (let i = 0; i < 30; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      byDay.set(d.toISOString().slice(0, 10), { sum: 0, count: 0 });
    }
    for (const o of orders) {
      if (o.estimated_margin_pct === null || o.estimated_margin_pct === undefined) continue;
      const key = String(o.date).slice(0, 10);
      const bucket = byDay.get(key);
      if (!bucket) continue;
      bucket.sum += Number(o.estimated_margin_pct);
      bucket.count += 1;
    }
    return Array.from(byDay.entries()).map(([date, v]) => ({
      date: date.slice(5),
      margin: v.count > 0 ? Number((v.sum / v.count).toFixed(2)) : null,
    }));
  }, [orders]);


  return (
    <PageContainer>
      <PageHeader
        title="Rentabilidade dos Pedidos"
        description="Snapshot de margem estimada (CMV + impostos) capturado no momento da criação do pedido."
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
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
            <KPICard
              title="Margem Média Estimada"
              value={`${analytics.avgMargin.toFixed(1)}%`}
              icon={Percent}
            />
            <KPICard title="Receita Total" value={fmtBRL(analytics.totalRevenue)} icon={DollarSign} />
            <KPICard title="CMV Estimado" value={fmtBRL(analytics.totalCost)} icon={TrendingDown} />
            <KPICard title="Impostos Estimados" value={fmtBRL(analytics.totalTax)} icon={Percent} />
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Evolução da Margem — últimos 30 dias
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [`${v}%`, 'Margem média']}
                  />
                  <ReferenceLine y={20} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" label={{ value: 'Meta 20%', fontSize: 10, fill: 'hsl(var(--muted-foreground))', position: 'insideTopRight' }} />
                  <Line
                    type="monotone"
                    dataKey="margin"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribuição por Semáforo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Row label="Saudável (≥20%)" count={analytics.green} total={analytics.snapCount} tone="emerald" />
                <Row label="Aceitável (8-20%)" count={analytics.yellow} total={analytics.snapCount} tone="yellow" />
                <Row label="Crítica (<8%)" count={analytics.red} total={analytics.snapCount} tone="red" />
                {analytics.withoutCost.length > 0 && (
                  <div className="flex items-start gap-2 rounded-md border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm text-yellow-500">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>
                      {analytics.withoutCost.length} pedido(s) sem custo cadastrado — margem não confiável.
                    </span>
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
        </>
      )}
    </PageContainer>
  );
}

function Row({ label, count, total, tone }: { label: string; count: number; total: number; tone: 'emerald' | 'yellow' | 'red' }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  const bar =
    tone === 'emerald' ? 'bg-emerald-500' : tone === 'yellow' ? 'bg-yellow-500' : 'bg-destructive';
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-mono text-muted-foreground">
          {count} · {pct.toFixed(0)}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function OrderRow({ number, client, total, margin }: { number: string; client: string; total: number; margin: number }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm border-b border-border/40 last:border-0 pb-2 last:pb-0">
      <div className="min-w-0">
        <div className="font-medium truncate">#{number}</div>
        <div className="text-xs text-muted-foreground truncate">{client}</div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="font-mono text-xs text-muted-foreground">{fmtBRL(total)}</span>
        <MarginBadge value={margin} />
      </div>
    </div>
  );
}
