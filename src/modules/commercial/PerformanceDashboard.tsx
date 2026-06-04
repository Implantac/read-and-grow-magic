import { useMemo } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Progress } from '@/ui/base/progress';
import { Skeleton } from '@/ui/base/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { formatBRL } from '@/lib/formatters';
import {
  Target, TrendingUp, Users, Trophy, DollarSign, BarChart3,
  AlertTriangle, XCircle, ArrowDownRight, ArrowUpRight, Medal,
} from 'lucide-react';
import { useOrders } from '@/hooks/commercial/useOrders';
import { useClients } from '@/hooks/commercial/useClients';
import { useSalesFunnel } from '@/hooks/commercial/useSalesFunnel';
import { useSalesReps } from '@/hooks/commercial/useSalesReps';
import { useSales } from '@/hooks/commercial/useSales';
import { useRepPerformance, useLostSalesAlerts, useClientInsights } from '@/hooks/commercial/useSalesIntelligence';
import { useFollowUps } from '@/hooks/commercial/useSalesIntelligence';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { startOfMonth, endOfMonth } from 'date-fns';

const fmtShort = (v: number) => {
  if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(0)}K`;
  return formatBRL(v);
};
const MEDAL_COLORS = ['text-yellow-500', 'text-gray-400', 'text-amber-700'];
const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function PerformanceDashboard() {
  const { data: orders = [], isLoading: lo } = useOrders();
  const { data: clients = [] } = useClients();
  const { data: funnel = [], isLoading: lf } = useSalesFunnel();
  const { data: reps = [] } = useSalesReps();
  const { data: sales = [] } = useSales() as { data: any[] | undefined };
  const { data: followUps = [] } = useFollowUps();

  const performances = useRepPerformance(reps, orders, funnel);
  const lostAlerts = useLostSalesAlerts(funnel, orders, followUps);
  const insights = useClientInsights(clients, orders, sales);
  const loading = lo || lf;

  const globalStats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const monthOrders = orders.filter(o => {
      const d = new Date(o.date);
      return d >= monthStart && d <= monthEnd && o.status !== 'cancelled';
    });
    const monthBilling = monthOrders.reduce((s, o) => s + o.total, 0);
    const avgTicket = monthOrders.length > 0 ? monthBilling / monthOrders.length : 0;
    const totalTarget = reps.reduce((s, r) => s + (r.monthly_target || 0), 0);
    const wonDeals = funnel.filter(f => f.status === 'won').length;
    const lostDeals = funnel.filter(f => f.status === 'lost').length;
    const conversionRate = (wonDeals + lostDeals) > 0 ? (wonDeals / (wonDeals + lostDeals)) * 100 : 0;
    const lostValue = lostAlerts.reduce((s, a) => s + a.estimatedLoss, 0);
    const atRiskClients = insights.filter(i => i.riskLevel === 'critical' || i.riskLevel === 'high').length;

    return { monthBilling, avgTicket, totalTarget, conversionRate, wonDeals, lostDeals, lostValue, atRiskClients, monthOrders: monthOrders.length };
  }, [orders, reps, funnel, lostAlerts, insights]);

  // Funnel conversion by stage
  const funnelConversion = useMemo(() => {
    const stages = ['lead', 'opportunity', 'proposal_sent', 'negotiation', 'awaiting_approval', 'approved'];
    const labels: Record<string, string> = {
      lead: 'Lead', opportunity: 'Oportunidade', proposal_sent: 'Proposta',
      negotiation: 'Negociação', awaiting_approval: 'Aprovação', approved: 'Aprovado',
    };
    return stages.map((stage, idx) => {
      const inOrPast = funnel.filter(f => {
        const fIdx = stages.indexOf(f.stage);
        return fIdx >= idx || f.status === 'won';
      }).length;
      const pastThis = funnel.filter(f => {
        const fIdx = stages.indexOf(f.stage);
        return fIdx > idx || f.status === 'won';
      }).length;
      const rate = inOrPast > 0 ? (pastThis / inOrPast) * 100 : 0;
      return { name: labels[stage], total: inOrPast, passed: pastThis, rate: Math.round(rate), dropoff: Math.round(100 - rate) };
    });
  }, [funnel]);

  if (loading) {
    return (
      <PageContainer>
        <PageHeader title="Performance Comercial" description="Indicadores de desempenho da equipe" />
        <div className="grid gap-4 md:grid-cols-4 mt-6">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Performance Comercial" description="Análise completa do desempenho da equipe e indicadores de conversão" />

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6 mt-6">
        <KPICard index={0} title="Faturamento Mês" value={fmtShort(globalStats.monthBilling)}
          subtitle={`${globalStats.monthOrders} pedidos`}
          icon={<DollarSign className="h-5 w-5" />} accentColor="primary" />
        <KPICard index={1} title="Ticket Médio" value={formatBRL(globalStats.avgTicket)}
          icon={<TrendingUp className="h-5 w-5" />} accentColor="accent" />
        <KPICard index={2} title="Taxa Conversão" value={`${globalStats.conversionRate.toFixed(1)}%`}
          subtitle={`${globalStats.wonDeals} ganhos / ${globalStats.lostDeals} perdidos`}
          icon={<Target className="h-5 w-5" />} accentColor="success" />
        <KPICard index={3} title="Vendas Perdidas" value={fmtShort(globalStats.lostValue)}
          subtitle={`${lostAlerts.length} alertas ativos`}
          icon={<XCircle className="h-5 w-5" />} accentColor="danger" />
        <KPICard index={4} title="Clientes em Risco" value={globalStats.atRiskClients.toString()}
          icon={<AlertTriangle className="h-5 w-5" />} accentColor="warning" />
      </div>

      <Tabs defaultValue="ranking" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ranking">🏆 Ranking Vendedores</TabsTrigger>
          <TabsTrigger value="conversion">📊 Conversão do Funil</TabsTrigger>
          <TabsTrigger value="lost">🚨 Vendas Perdidas ({lostAlerts.length})</TabsTrigger>
        </TabsList>

        {/* Ranking Tab */}
        <TabsContent value="ranking" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" /> Ranking de Vendedores
                </CardTitle>
              </CardHeader>
              <CardContent>
                {performances.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Sem dados de vendedores</p>
                ) : (
                  <div className="space-y-3">
                    {performances.map((p, i) => (
                      <div key={p.repId} className={`flex items-center gap-3 p-3 rounded-lg border ${i === 0 ? 'bg-primary/5 border-primary/20' : ''}`}>
                        <div className="shrink-0 w-8 text-center">
                          {i < 3 ? (
                            <Medal className={`h-6 w-6 mx-auto ${MEDAL_COLORS[i]}`} />
                          ) : (
                            <span className="text-lg font-bold text-muted-foreground">{i + 1}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium truncate">{p.repName}</span>
                            <span className="text-sm font-bold text-primary">{formatBRL(p.totalSales)}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                            <span>{p.ordersCount} pedidos</span>
                            <span>Ticket: {formatBRL(p.avgTicket)}</span>
                            <span>Conv: {p.conversionRate.toFixed(0)}%</span>
                            <span>{p.clientsServed} clientes</span>
                          </div>
                          {p.monthlyTarget > 0 && (
                            <div className="flex items-center gap-2 mt-1">
                              <Progress value={Math.min(p.targetPct, 100)} className="h-1 flex-1" />
                              <span className={`text-[10px] font-medium ${p.targetPct >= 100 ? 'text-emerald-600' : p.targetPct >= 70 ? 'text-amber-600' : 'text-destructive'}`}>
                                {p.targetPct.toFixed(0)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sales by rep chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Faturamento por Vendedor</CardTitle>
              </CardHeader>
              <CardContent>
                {performances.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={performances.slice(0, 8)} layout="vertical">
                      <XAxis type="number" tickFormatter={v => fmtShort(v)} fontSize={10} />
                      <YAxis type="category" dataKey="repName" width={100} fontSize={11} />
                      <Tooltip formatter={(v: number) => formatBRL(v)} />
                      <Bar dataKey="totalSales" radius={[0, 4, 4, 0]}>
                        {performances.slice(0, 8).map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Sem dados</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detailed comparison table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Comparativo Detalhado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">#</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Vendedor</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Faturamento</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Pedidos</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Ticket Médio</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Conversão</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Ganhos</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Perdidos</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Clientes</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Meta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performances.map(p => (
                      <tr key={p.repId} className="border-b hover:bg-muted/30">
                        <td className="px-3 py-2 font-bold">{p.ranking}</td>
                        <td className="px-3 py-2 font-medium">{p.repName}</td>
                        <td className="px-3 py-2 text-right font-semibold text-primary">{formatBRL(p.totalSales)}</td>
                        <td className="px-3 py-2 text-right">{p.ordersCount}</td>
                        <td className="px-3 py-2 text-right">{formatBRL(p.avgTicket)}</td>
                        <td className="px-3 py-2 text-right">
                          <Badge variant={p.conversionRate >= 50 ? 'default' : 'secondary'}>{p.conversionRate.toFixed(0)}%</Badge>
                        </td>
                        <td className="px-3 py-2 text-right text-emerald-600">{p.wonDeals}</td>
                        <td className="px-3 py-2 text-right text-destructive">{p.lostDeals}</td>
                        <td className="px-3 py-2 text-right">{p.clientsServed}</td>
                        <td className="px-3 py-2 text-right">
                          {p.monthlyTarget > 0 ? (
                            <Badge variant={p.targetPct >= 100 ? 'default' : p.targetPct >= 70 ? 'secondary' : 'destructive'}>
                              {p.targetPct.toFixed(0)}%
                            </Badge>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conversion Tab */}
        <TabsContent value="conversion" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Taxa de Conversão por Etapa do Funil
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {funnelConversion.map((stage, i) => (
                  <div key={stage.name} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{stage.name}</span>
                        <Badge variant="outline" className="text-[10px]">{stage.total} entradas</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${stage.rate >= 70 ? 'text-emerald-600' : stage.rate >= 40 ? 'text-amber-600' : 'text-destructive'}`}>
                          {stage.rate}% avançam
                        </span>
                        {stage.dropoff > 30 && (
                          <Badge variant="destructive" className="text-[10px]">
                            <ArrowDownRight className="h-3 w-3 mr-0.5" />{stage.dropoff}% perda
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <div className="h-3 bg-emerald-500 rounded-l" style={{ width: `${stage.rate}%` }} />
                      <div className="h-3 bg-destructive/30 rounded-r flex-1" />
                    </div>
                    {stage.dropoff > 50 && (
                      <p className="text-[11px] text-destructive">
                        ⚠️ Gargalo: você perde {stage.dropoff}% nesta etapa. Revise abordagem e scripts.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Funnel bar chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Volume por Etapa</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={funnelConversion}>
                  <XAxis dataKey="name" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Entradas" />
                  <Bar dataKey="passed" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Avançaram" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lost Sales Tab */}
        <TabsContent value="lost" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                Você Está Perdendo Essas Vendas
                <Badge variant="destructive">{lostAlerts.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lostAlerts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma venda em risco identificada 🎉</p>
              ) : (
                <div className="space-y-3">
                  {lostAlerts.map((alert, i) => {
                    const typeConfig = {
                      stagnant_funnel: { icon: '⏳', color: 'border-amber-500/50 bg-amber-50 dark:bg-amber-950/20' },
                      no_followup: { icon: '📞', color: 'border-blue-500/50 bg-blue-50 dark:bg-blue-950/20' },
                      expired_quote: { icon: '📄', color: 'border-purple-500/50 bg-purple-50 dark:bg-purple-950/20' },
                      cancelled_order: { icon: '❌', color: 'border-red-500/50 bg-red-50 dark:bg-red-950/20' },
                    };
                    const config = typeConfig[alert.type];
                    return (
                      <div key={i} className={`p-4 rounded-lg border ${config.color}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{config.icon}</span>
                              <span className="text-sm font-medium">{alert.title}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>
                          </div>
                          {alert.estimatedLoss > 0 && (
                            <Badge variant="destructive" className="shrink-0">
                              {formatBRL(alert.estimatedLoss)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
                    <p className="text-sm font-medium text-destructive">
                      Total em risco: {formatBRL(lostAlerts.reduce((s, a) => s + a.estimatedLoss, 0))}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Agir agora pode recuperar parte significativa deste valor
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
