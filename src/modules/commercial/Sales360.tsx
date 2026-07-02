import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, TrendingUp, Users, DollarSign, Activity, ExternalLink } from 'lucide-react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { Skeleton } from '@/ui/base/skeleton';
import { EmptyState } from '@/shared/components/EmptyState';
import { formatBRL, formatDate } from '@/lib/formatters';
import { useOrders } from '@/hooks/commercial/useOrders';
import { useClients } from '@/hooks/commercial/useClients';
import { useSalesReps } from '@/hooks/commercial/useSalesReps';
import { useCommercialAlerts } from '@/hooks/commercial/useCommercialAlerts';
import { statusSteps } from './orders/constants';
import { SalesKanbanBoard } from './orders/SalesKanbanBoard';
import { Client360Drawer } from './Client360Drawer';

const statusLabels: Record<string, string> = {
  pending: 'Pendente', confirmed: 'Confirmado', processing: 'Processando',
  separated: 'Separado', invoiced: 'Faturado', shipped: 'Enviado', delivered: 'Entregue',
};

type PeriodKey = '7d' | '30d' | '90d' | 'all';

export default function Sales360() {
  const [sellerId, setSellerId] = useState<string>('all');
  const [period, setPeriod] = useState<PeriodKey>('30d');

  const { data: orders = [], isLoading: lo } = useOrders();
  const { data: clients = [], isLoading: lc } = useClients();
  const { data: reps = [] } = useSalesReps();
  const { data: alerts = [] } = useCommercialAlerts('open');

  const cutoff = useMemo(() => {
    if (period === 'all') return null;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const d = new Date(); d.setDate(d.getDate() - days); return d;
  }, [period]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (sellerId !== 'all' && o.sales_rep_id !== sellerId) return false;
      if (cutoff && new Date(o.date) < cutoff) return false;
      return true;
    });
  }, [orders, sellerId, cutoff]);

  const filteredAlerts = useMemo(() => {
    return sellerId === 'all' ? alerts : alerts.filter((a: any) => a.seller_id === sellerId);
  }, [alerts, sellerId]);

  const kpis = useMemo(() => {
    const active = filteredOrders.filter((o) => !['cancelled', 'delivered'].includes(o.status));
    const revenue = filteredOrders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + Number(o.total || 0), 0);
    const avgMargin = (() => {
      const withMargin = filteredOrders.filter((o) => o.estimated_margin_pct != null);
      if (!withMargin.length) return 0;
      return withMargin.reduce((s, o) => s + Number(o.estimated_margin_pct || 0), 0) / withMargin.length;
    })();
    const clientIds = new Set(filteredOrders.map((o) => o.client_id).filter(Boolean));
    return {
      activeOrders: active.length,
      revenue,
      avgMargin,
      activeClients: clientIds.size,
      openAlerts: filteredAlerts.length,
    };
  }, [filteredOrders, filteredAlerts]);

  const topClients = useMemo(() => {
    const map = new Map<string, { name: string; total: number; count: number }>();
    filteredOrders.forEach((o) => {
      if (o.status === 'cancelled' || !o.client_id) return;
      const cur = map.get(o.client_id) || { name: o.client_name, total: 0, count: 0 };
      cur.total += Number(o.total || 0); cur.count += 1;
      map.set(o.client_id, cur);
    });
    return Array.from(map.entries()).map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.total - a.total).slice(0, 8);
  }, [filteredOrders]);

  const loading = lo || lc;

  return (
    <PageContainer>
      <PageHeader
        title="Vendas 360°"
        description="Painel único consolidando pipeline, exceções, clientes e rentabilidade"
      />

      {/* Filtros globais */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Vendedor:</span>
          <Select value={sellerId} onValueChange={setSellerId}>
            <SelectTrigger className="w-[220px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {reps.map((r: any) => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Período:</span>
          <Select value={period} onValueChange={(v) => setPeriod(v as PeriodKey)}>
            <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="all">Todo o período</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to="/comercial/pdv">Nova venda (PDV)</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/comercial/o2c-monitor">Monitor O2C <ExternalLink className="ml-1 h-3 w-3" /></Link>
          </Button>
        </div>
      </div>

      {/* KPIs */}
      {loading ? (
        <div className="mt-6 grid gap-4 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-5">
          <KPICard title="Pedidos ativos" value={String(kpis.activeOrders)} icon={Activity} />
          <KPICard title="Faturamento" value={formatBRL(kpis.revenue)} icon={DollarSign} />
          <KPICard title="Margem média" value={`${kpis.avgMargin.toFixed(1)}%`} icon={TrendingUp} />
          <KPICard title="Clientes ativos" value={String(kpis.activeClients)} icon={Users} />
          <KPICard title="Alertas abertos" value={String(kpis.openAlerts)} icon={AlertTriangle} />
        </div>
      )}

      <Tabs defaultValue="pipeline" className="mt-6 space-y-4">
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="excecoes">Exceções ({filteredAlerts.length})</TabsTrigger>
          <TabsTrigger value="clientes">Clientes Top</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline">
          {loading ? (
            <Skeleton className="h-[400px]" />
          ) : filteredOrders.length === 0 ? (
            <EmptyState title="Sem pedidos no período" description="Ajuste o filtro ou crie uma nova venda no PDV." />
          ) : (
            <SalesKanbanBoard
              orders={filteredOrders}
              onView={() => {}}
              onAdvance={() => {}}
              onAskCancel={() => {}}
            />
          )}
        </TabsContent>

        <TabsContent value="excecoes">
          <Card>
            <CardHeader><CardTitle className="text-base">Alertas Comerciais</CardTitle></CardHeader>
            <CardContent>
              {filteredAlerts.length === 0 ? (
                <EmptyState title="Nenhum alerta aberto" description="Boa notícia — sem exceções no filtro atual." />
              ) : (
                <div className="space-y-2">
                  {filteredAlerts.slice(0, 20).map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={a.severity === 'critical' ? 'destructive' : 'secondary'} className="text-[10px]">
                            {a.severity}
                          </Badge>
                          <p className="truncate text-sm font-medium">{a.title || a.alert_type}</p>
                        </div>
                        {a.description && (
                          <p className="mt-1 truncate text-xs text-muted-foreground">{a.description}</p>
                        )}
                      </div>
                      <span className="ml-3 text-xs text-muted-foreground">{formatDate(a.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clientes">
          <Card>
            <CardHeader><CardTitle className="text-base">Top Clientes no Período</CardTitle></CardHeader>
            <CardContent>
              {topClients.length === 0 ? (
                <EmptyState title="Sem clientes no período" description="Ajuste os filtros para ver os principais compradores." />
              ) : (
                <div className="divide-y">
                  {topClients.map((c, i) => (
                    <div key={c.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 text-xs font-bold text-muted-foreground">#{i + 1}</span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.count} pedido{c.count === 1 ? '' : 's'}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold">{formatBRL(c.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Distribuição por status */}
      {!loading && filteredOrders.length > 0 && (
        <Card className="mt-6">
          <CardHeader><CardTitle className="text-base">Distribuição por Status</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-7">
              {statusSteps.map((s) => {
                const count = filteredOrders.filter((o) => o.status === s).length;
                return (
                  <div key={s} className="rounded-lg border bg-muted/30 p-3 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {statusLabels[s]}
                    </p>
                    <p className="mt-1 text-2xl font-bold">{count}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
