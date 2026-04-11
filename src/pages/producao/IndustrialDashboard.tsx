import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProductCosts } from '@/hooks/useProductCosts';
import { useSupplyStock } from '@/hooks/useSupplyStock';
import { useIndustrialAlerts } from '@/hooks/useIndustrialAlerts';
import { useProductionOrders } from '@/hooks/useProductionOrders';
import { KPICard } from '@/components/shared/KPICard';
import { DollarSign, TrendingUp, AlertTriangle, Factory, Package, Gauge, CheckCircle, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function IndustrialDashboard() {
  const { costs, avgMargin, totalRevenue, totalCostSum, lowMarginProducts, highCostProducts } = useProductCosts();
  const { supplies, lowStockItems } = useSupplyStock();
  const { activeAlerts, resolveAlert } = useIndustrialAlerts();
  const { orders: productionOrders } = useProductionOrders();

  const totalProfit = totalRevenue - totalCostSum;
  const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const supplyValue = supplies.reduce((s, i) => s + i.total_value, 0);
  const completedOPs = productionOrders.filter(o => o.status === 'completed').length;
  const inProgressOPs = productionOrders.filter(o => o.status === 'in_progress').length;

  // Cost breakdown chart
  const costBreakdown = costs.length > 0 ? [
    { name: 'Mat. Prima', value: costs.reduce((s, c) => s + Number(c.raw_material_cost), 0) },
    { name: 'Mão de Obra', value: costs.reduce((s, c) => s + Number(c.labor_cost), 0) },
    { name: 'Operacional', value: costs.reduce((s, c) => s + Number(c.operational_cost), 0) },
  ] : [];

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--warning))', 'hsl(var(--info))'];

  // Top 10 products by margin
  const topProducts = [...costs].sort((a, b) => b.profit_margin - a.profit_margin).slice(0, 10).map(c => ({
    name: c.product_name.length > 15 ? c.product_name.slice(0, 15) + '...' : c.product_name,
    margem: Number(c.profit_margin.toFixed(1)),
    custo: Number(c.total_cost),
    venda: Number(c.sale_price),
  }));

  // Margin distribution
  const marginDist = [
    { name: '< 0%', value: costs.filter(c => c.profit_margin < 0).length },
    { name: '0-15%', value: costs.filter(c => c.profit_margin >= 0 && c.profit_margin < 15).length },
    { name: '15-30%', value: costs.filter(c => c.profit_margin >= 15 && c.profit_margin < 30).length },
    { name: '30-50%', value: costs.filter(c => c.profit_margin >= 30 && c.profit_margin < 50).length },
    { name: '> 50%', value: costs.filter(c => c.profit_margin >= 50).length },
  ].filter(d => d.value > 0);

  const MARGIN_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'];

  const allAlerts = [
    ...lowStockItems.map(s => ({
      id: `stock-${s.id}`, type: 'Falta de Material', severity: 'critical' as const,
      title: `${s.name} em estoque crítico`, detail: `${s.current_quantity} ${s.unit} (mín: ${s.min_quantity})`,
    })),
    ...lowMarginProducts.map(c => ({
      id: `margin-${c.id}`, type: 'Margem Baixa', severity: 'warning' as const,
      title: `${c.product_name} com margem de ${c.profit_margin.toFixed(1)}%`, detail: `Custo: R$ ${c.total_cost.toFixed(2)} | Venda: R$ ${c.sale_price.toFixed(2)}`,
    })),
    ...highCostProducts.map(c => ({
      id: `cost-${c.id}`, type: 'Custo Elevado', severity: 'warning' as const,
      title: `${c.product_name} com custo elevado`, detail: `Custo: R$ ${c.total_cost.toFixed(2)} (>${(c.sale_price * 0.8).toFixed(2)})`,
    })),
    ...activeAlerts.map(a => ({
      id: a.id, type: a.alert_type, severity: a.severity as any,
      title: a.title, detail: a.description || '',
    })),
  ];

  const severityConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    critical: { color: 'bg-red-100 text-red-800', icon: <XCircle className="h-4 w-4 text-destructive" /> },
    warning: { color: 'bg-yellow-100 text-yellow-800', icon: <AlertTriangle className="h-4 w-4 text-warning" /> },
    info: { color: 'bg-blue-100 text-blue-800', icon: <CheckCircle className="h-4 w-4 text-info" /> },
  };

  if (costs.length === 0 && supplies.length === 0) {
    return (
      <PageContainer>
        <PageHeader title="Dashboard Industrial" description="Controle total de custo, lucro e eficiência produtiva" />
        <Card><CardContent className="py-12 text-center">
          <Factory className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Cadastre custos e insumos</h3>
          <p className="text-muted-foreground">Acesse "Custo e Lucro" e "Estoque de Insumos" para começar a análise.</p>
        </CardContent></Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Dashboard Industrial" description="Controle total de custo, lucro e eficiência produtiva" />

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-6">
        <KPICard title="Receita Total" value={`R$ ${(totalRevenue / 1000).toFixed(1)}k`} icon={<DollarSign className="h-5 w-5" />} accentColor="primary" index={0} />
        <KPICard title="Custo Total" value={`R$ ${(totalCostSum / 1000).toFixed(1)}k`} icon={<Factory className="h-5 w-5" />} accentColor="info" index={1} />
        <KPICard title="Lucro" value={`R$ ${(totalProfit / 1000).toFixed(1)}k`} icon={<TrendingUp className="h-5 w-5" />} accentColor="success" index={2} />
        <KPICard title="Margem Geral" value={`${overallMargin.toFixed(1)}%`} icon={<Gauge className="h-5 w-5" />} accentColor={overallMargin >= 20 ? 'success' : 'warning'} index={3} />
        <KPICard title="Estoque Insumos" value={`R$ ${(supplyValue / 1000).toFixed(1)}k`} icon={<Package className="h-5 w-5" />} accentColor="info" index={4} />
        <KPICard title="Alertas" value={allAlerts.length} icon={<AlertTriangle className="h-5 w-5" />} accentColor={allAlerts.length > 0 ? 'warning' : 'success'} index={5} />
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Composição de Custos</CardTitle></CardHeader>
          <CardContent>
            {costBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={costBreakdown} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                    {costBreakdown.map((_, idx) => <Cell key={idx} fill={COLORS[idx]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-center py-8 text-muted-foreground">Sem dados</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Distribuição de Margens</CardTitle></CardHeader>
          <CardContent>
            {marginDist.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={marginDist} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                    {marginDist.map((_, idx) => <Cell key={idx} fill={MARGIN_COLORS[idx]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-center py-8 text-muted-foreground">Sem dados</p>}
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      {topProducts.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Top 10 Produtos por Margem</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => v.toFixed(1)} />
                <Bar dataKey="margem" fill="hsl(var(--primary))" name="Margem %" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {allAlerts.length > 0 && (
        <Card className="border-warning/30">
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-warning" /> Alertas Inteligentes ({allAlerts.length})</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Tipo</TableHead><TableHead>Alerta</TableHead><TableHead>Detalhe</TableHead><TableHead>Severidade</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {allAlerts.slice(0, 20).map(a => {
                  const sev = severityConfig[a.severity] || severityConfig.warning;
                  return (
                    <TableRow key={a.id}>
                      <TableCell>{a.type}</TableCell>
                      <TableCell className="font-medium">{a.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{a.detail}</TableCell>
                      <TableCell><Badge className={sev.color}>{a.severity}</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
