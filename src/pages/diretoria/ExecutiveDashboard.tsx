import { useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Brain, TrendingUp, TrendingDown, DollarSign, AlertTriangle, Users,
  Send, MessageSquare, Lightbulb, ShieldAlert, BarChart3,
  ArrowUpRight, ArrowDownRight, Wallet, PieChart, Activity,
  Target, Factory, Layers, Zap, MapPin, Package, Flame,
  Bot, FileText, Loader2, Trash2, Sparkles, ShoppingCart,
} from 'lucide-react';
import { useExecutiveDashboard, useGenerateInsights, useGenerateScenarios, useExecutiveChat, useAssistantChat, useDailySummary } from '@/hooks/useExecutiveAI';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, PieChart as RPieChart, Pie } from 'recharts';
import ReactMarkdown from 'react-markdown';

const fmt = (v: number) => v >= 1000000
  ? `R$ ${(v / 1000000).toFixed(1)}M`
  : v >= 1000
    ? `R$ ${(v / 1000).toFixed(0)}k`
    : `R$ ${v.toFixed(0)}`;

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

const insightIcon: Record<string, any> = {
  revenue: TrendingUp,
  profit: DollarSign,
  cost: Wallet,
  risk: ShieldAlert,
  operational: Factory,
  commercial: Users,
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

export default function ExecutiveDashboard() {
  const { data, isLoading } = useExecutiveDashboard();
  const generateInsights = useGenerateInsights();
  const generateScenarios = useGenerateScenarios();
  const { messages, isLoading: chatLoading, sendMessage, clearChat } = useExecutiveChat();
  const [chatInput, setChatInput] = useState('');

  const handleSend = () => {
    if (!chatInput.trim()) return;
    sendMessage(chatInput.trim());
    setChatInput('');
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="IA Executiva" description="Carregando análise..." />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>)}
        </div>
      </PageContainer>
    );
  }

  const kpis = data?.kpis;
  const revenueByMonth = data?.revenueByMonth || [];
  const topClients = data?.topClients || [];
  const insights = data?.insights || [];
  const alerts = data?.alerts || [];
  const scenarios = data?.scenarios || [];
  const expenseByCategory = data?.expenseByCategory || {};
  const salesRepStats = data?.salesRepStats || [];
  const funnelByStage = data?.funnelByStage || {};
  const productMargins = (data as any)?.productMargins || [];
  const lowMarginProducts = (data as any)?.lowMarginProducts || [];
  const revenueByRegion = (data as any)?.revenueByRegion || {};
  const autoAlerts = (data as any)?.autoAlerts || [];

  const expenseData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value })).sort((a, b) => (b.value as number) - (a.value as number)).slice(0, 6);
  const funnelData = Object.entries(funnelByStage).map(([stage, v]: any) => ({ stage, ...v }));
  const regionData = Object.entries(revenueByRegion).map(([name, value]) => ({ name, value })).sort((a, b) => (b.value as number) - (a.value as number));
  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--muted-foreground))'];

  const kpiCards = [
    { label: 'Receita Total', value: fmt(kpis?.totalRevenue || 0), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-500/10', sub: `${(kpis?.revenueGrowth ?? 0) >= 0 ? '+' : ''}${kpis?.revenueGrowth || 0}% vs mês anterior` },
    { label: 'Lucro Bruto', value: fmt(kpis?.grossProfit || 0), icon: DollarSign, color: 'text-primary', bg: 'bg-primary/10', sub: `Margem ${kpis?.grossMargin || 0}%` },
    { label: 'Inadimplência', value: fmt(kpis?.overdueReceivable || 0), icon: AlertTriangle, color: kpis?.defaultRate && kpis.defaultRate > 10 ? 'text-destructive' : 'text-orange-500', bg: kpis?.defaultRate && kpis.defaultRate > 10 ? 'bg-destructive/10' : 'bg-orange-500/10', sub: `${kpis?.defaultRate || 0}% da carteira` },
    { label: 'Posição Líquida', value: fmt(kpis?.netPosition || 0), icon: Wallet, color: (kpis?.netPosition || 0) >= 0 ? 'text-emerald-600' : 'text-destructive', bg: (kpis?.netPosition || 0) >= 0 ? 'bg-emerald-500/10' : 'bg-destructive/10' },
  ];

  const quickQuestions = [
    'Como está o desempenho da empresa?',
    'Onde estamos perdendo dinheiro?',
    'Quais clientes estão em risco?',
    'O que fazer para aumentar lucro?',
    'Qual vendedor precisa de atenção?',
    'Como está o fluxo de caixa?',
    'Quais produtos têm margem baixa?',
    'Como está a meta de vendas?',
  ];

  const latestScenario = scenarios[0];

  return (
    <PageContainer>
      <PageHeader title="🧠 IA Executiva" description="Diretor Digital — Visão estratégica com inteligência artificial">
        <div className="flex gap-2">
          <Button onClick={() => generateInsights.mutate()} disabled={generateInsights.isPending} variant="outline" size="sm" className="gap-2">
            <Brain className={cn('h-4 w-4', generateInsights.isPending && 'animate-spin')} />
            Gerar Insights
          </Button>
          <Button onClick={() => generateScenarios.mutate()} disabled={generateScenarios.isPending} variant="outline" size="sm" className="gap-2">
            <Layers className={cn('h-4 w-4', generateScenarios.isPending && 'animate-spin')} />
            Cenários
          </Button>
        </div>
      </PageHeader>

      {/* ── Primary KPIs ── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((k, idx) => (
          <Card key={k.label} className="hover-lift" style={{ animationDelay: `${idx * 60}ms` }}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{k.label}</p>
                  <p className="text-2xl font-bold tabular-nums">{k.value}</p>
                  {k.sub && <p className="text-xs text-muted-foreground">{k.sub}</p>}
                </div>
                <div className={cn('rounded-xl p-2.5', k.bg)}>
                  <k.icon className={cn('h-5 w-5', k.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Secondary KPIs with Target Progress ── */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Users className="h-4 w-4 text-primary" />
          <div><p className="text-xs text-muted-foreground">Clientes Ativos</p><p className="text-lg font-bold">{kpis?.activeClients || 0}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <div><p className="text-xs text-muted-foreground">Em Risco</p><p className="text-lg font-bold">{kpis?.clientsAtRisk || 0}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Target className="h-4 w-4 text-primary" />
          <div><p className="text-xs text-muted-foreground">Ticket Médio</p><p className="text-lg font-bold">{fmt(kpis?.avgTicket || 0)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Factory className="h-4 w-4 text-orange-500" />
          <div><p className="text-xs text-muted-foreground">Efic. Produção</p><p className="text-lg font-bold">{kpis?.prodEfficiency || 0}%</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Activity className="h-4 w-4 text-emerald-600" />
          <div><p className="text-xs text-muted-foreground">Caixa 30d</p><p className="text-lg font-bold">{fmt(kpis?.cashFlowProjection30d || 0)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Package className="h-4 w-4 text-destructive" />
          <div><p className="text-xs text-muted-foreground">Estoque Crítico</p><p className="text-lg font-bold">{kpis?.lowStockProducts || 0}</p></div>
        </CardContent></Card>
      </div>

      {/* ── Target Attainment Bar ── */}
      {(kpis?.totalTarget || 0) > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Meta de Vendas</span>
              </div>
              <span className="text-sm font-bold">{kpis?.targetAttainment || 0}%</span>
            </div>
            <Progress value={Math.min(100, kpis?.targetAttainment || 0)} className="h-2.5" />
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              <span>Atingido: {fmt(kpis?.totalAchieved || 0)}</span>
              <span>Meta: {fmt(kpis?.totalTarget || 0)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Proactive Auto-Alerts (always visible) ── */}
      {autoAlerts.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {autoAlerts.map((alert: any, i: number) => (
            <Card key={i} className={cn('border-l-4', alertSeverityBorder[alert.severity] || 'border-l-muted')}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-destructive" />
                    <p className="text-sm font-medium">{alert.title}</p>
                  </div>
                  <Badge className={cn('text-[10px]', severityColor[alert.severity])}>{alert.severity}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{alert.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="insights" className="gap-1.5"><Lightbulb className="h-3.5 w-3.5" />Insights</TabsTrigger>
          <TabsTrigger value="charts" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" />Análises</TabsTrigger>
          <TabsTrigger value="margins" className="gap-1.5"><DollarSign className="h-3.5 w-3.5" />Margens</TabsTrigger>
          <TabsTrigger value="alerts" className="gap-1.5"><ShieldAlert className="h-3.5 w-3.5" />Alertas & Riscos</TabsTrigger>
          <TabsTrigger value="scenarios" className="gap-1.5"><Layers className="h-3.5 w-3.5" />Cenários</TabsTrigger>
          <TabsTrigger value="chat" className="gap-1.5"><MessageSquare className="h-3.5 w-3.5" />Chat Gerencial</TabsTrigger>
        </TabsList>

        {/* ── Insights Tab ── */}
        <TabsContent value="insights" className="space-y-4">
          {insights.length === 0 ? (
            <Card><CardContent className="p-8 text-center">
              <Brain className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground mb-2">Clique em "Gerar Insights" para a IA analisar seus dados</p>
              <p className="text-xs text-muted-foreground">A IA irá analisar receita, lucro, custos, riscos, operação e performance comercial</p>
            </CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {insights.map((ins: any) => {
                const Icon = insightIcon[ins.insight_type] || Lightbulb;
                return (
                  <Card key={ins.id} className="hover-lift">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-primary" />
                          <CardTitle className="text-sm">{ins.title}</CardTitle>
                        </div>
                        <Badge className={cn('text-[10px]', severityColor[ins.severity] || severityColor.medium)}>{ins.severity}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-xs text-muted-foreground">{ins.description}</p>
                      {ins.explanation && (
                        <div className="rounded-md bg-muted/50 p-2">
                          <p className="text-xs font-medium text-foreground/80">💡 {ins.explanation}</p>
                        </div>
                      )}
                      {ins.impact_estimate && <p className="text-xs text-primary font-medium">📊 Impacto: {ins.impact_estimate}</p>}
                      {ins.recommended_actions?.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium">Ações recomendadas:</p>
                          {(Array.isArray(ins.recommended_actions) ? ins.recommended_actions : []).map((a: string, i: number) => (
                            <p key={i} className="text-xs text-muted-foreground">• {a}</p>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Charts Tab ── */}
        <TabsContent value="charts" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-600" />Receita Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{ revenue: { label: 'Receita', color: 'hsl(var(--chart-1))' } }} className="h-[250px]">
                  <BarChart data={revenueByMonth}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent formatter={(v) => fmt(Number(v))} />} />
                    <Bar dataKey="revenue" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />Top Clientes
                  {kpis?.concentrationPct && kpis.concentrationPct > 50 && (
                    <Badge variant="destructive" className="text-[10px]">⚠️ Concentração {kpis.concentrationPct}%</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topClients.map((c, i) => (
                    <div key={c.name} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.name}</p>
                        <div className="h-1.5 rounded-full bg-muted mt-1">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${(c.revenue / (topClients[0]?.revenue || 1)) * 100}%` }} />
                        </div>
                      </div>
                      <span className="text-sm font-bold tabular-nums">{fmt(c.revenue)}</span>
                    </div>
                  ))}
                  {topClients.length === 0 && <p className="text-xs text-center text-muted-foreground py-4">Sem dados de clientes</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><PieChart className="h-4 w-4 text-orange-500" />Despesas por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                {expenseData.length > 0 ? (
                  <ChartContainer config={{}} className="h-[250px]">
                    <RPieChart>
                      <Pie data={expenseData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {expenseData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent formatter={(v) => fmt(Number(v))} />} />
                    </RPieChart>
                  </ChartContainer>
                ) : <p className="text-xs text-center text-muted-foreground py-8">Sem dados de despesas</p>}
              </CardContent>
            </Card>

            {/* Revenue by Region */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />Receita por Região</CardTitle>
              </CardHeader>
              <CardContent>
                {regionData.length > 0 ? (
                  <div className="space-y-3">
                    {regionData.slice(0, 6).map((r, i) => (
                      <div key={r.name} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{r.name}</p>
                          <div className="h-1.5 rounded-full bg-muted mt-1">
                            <div className="h-full rounded-full bg-chart-3" style={{ width: `${((r.value as number) / ((regionData[0]?.value as number) || 1)) * 100}%` }} />
                          </div>
                        </div>
                        <span className="text-sm font-bold tabular-nums">{fmt(r.value as number)}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-center text-muted-foreground py-8">Sem dados de região</p>}
              </CardContent>
            </Card>
          </div>

          {/* Sales Rep & Funnel */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Zap className="h-4 w-4 text-primary" />Performance Vendedores</CardTitle>
              </CardHeader>
              <CardContent>
                {salesRepStats.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">Sem dados de vendedores</p>
                ) : (
                  <div className="space-y-3">
                    {salesRepStats.slice(0, 5).map((rep: any, i: number) => (
                      <div key={rep.id} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{rep.name}</p>
                          <p className="text-xs text-muted-foreground">{rep.orders} ped · TM {fmt(rep.avgTicket || 0)} · Desc {rep.discountPct || 0}%</p>
                        </div>
                        <span className="text-sm font-bold tabular-nums">{fmt(rep.revenue)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {funnelData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4 text-primary" />Funil de Vendas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
                    {funnelData.map((f: any) => (
                      <div key={f.stage} className="rounded-lg border p-3 text-center">
                        <p className="text-xs text-muted-foreground capitalize">{f.stage}</p>
                        <p className="text-lg font-bold">{f.count}</p>
                        <p className="text-xs text-muted-foreground">{fmt(f.value)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ── Margins Tab ── */}
        <TabsContent value="margins" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Top Profitable Products */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-600" />Produtos Mais Rentáveis</CardTitle>
              </CardHeader>
              <CardContent>
                {productMargins.length > 0 ? (
                  <div className="space-y-3">
                    {productMargins.slice(0, 6).map((p: any, i: number) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{p.name}</p>
                          <div className="flex gap-2 text-xs text-muted-foreground">
                            <span>Receita: {fmt(p.revenue)}</span>
                            <span>·</span>
                            <span>Qtd: {p.qty}</span>
                          </div>
                        </div>
                        <Badge className={cn('text-[10px]', p.marginPct >= 30 ? 'bg-emerald-500/20 text-emerald-700' : p.marginPct >= 15 ? 'bg-blue-500/20 text-blue-700' : 'bg-destructive/20 text-destructive')}>
                          {p.marginPct}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-center text-muted-foreground py-8">Cadastre produtos com custo para análise de margem</p>
                )}
              </CardContent>
            </Card>

            {/* Low Margin Products */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><TrendingDown className="h-4 w-4 text-destructive" />Produtos com Margem Baixa (&lt;15%)</CardTitle>
              </CardHeader>
              <CardContent>
                {lowMarginProducts.length > 0 ? (
                  <div className="space-y-3">
                    {lowMarginProducts.map((p: any, i: number) => (
                      <div key={i} className="flex items-center gap-3">
                        <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground">Receita: {fmt(p.revenue)} · Custo: {fmt(p.cost)}</p>
                        </div>
                        <Badge variant="destructive" className="text-[10px]">{p.marginPct}%</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="h-8 w-8 mx-auto text-emerald-500/50 mb-2" />
                    <p className="text-xs text-muted-foreground">Todos os produtos com margem saudável ✓</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Margin Chart */}
          {productMargins.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" />Margem por Produto (Top 10)</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{ marginPct: { label: 'Margem %', color: 'hsl(var(--chart-1))' } }} className="h-[300px]">
                  <BarChart data={productMargins.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis type="number" tickFormatter={(v) => `${v}%`} className="text-xs" />
                    <YAxis dataKey="name" type="category" width={120} className="text-xs" tick={{ fontSize: 10 }} />
                    <ChartTooltip content={<ChartTooltipContent formatter={(v) => `${v}%`} />} />
                    <Bar dataKey="marginPct" radius={[0, 4, 4, 0]}>
                      {productMargins.slice(0, 10).map((p: any, i: number) => (
                        <Cell key={i} fill={p.marginPct >= 30 ? 'hsl(var(--chart-1))' : p.marginPct >= 15 ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Alerts Tab ── */}
        <TabsContent value="alerts" className="space-y-4">
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

          {alerts.length > 0 && (
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
          )}
          {alerts.length === 0 && (
            <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">Nenhum alerta ativo no momento</CardContent></Card>
          )}
        </TabsContent>

        {/* ── Scenarios Tab ── */}
        <TabsContent value="scenarios" className="space-y-4">
          {!latestScenario ? (
            <Card><CardContent className="p-8 text-center">
              <Layers className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground mb-2">Clique em "Cenários" para gerar projeções estratégicas</p>
              <p className="text-xs text-muted-foreground">Serão gerados cenários otimista, realista e pessimista para os próximos 3 meses</p>
            </CardContent></Card>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { key: 'optimistic', label: '🟢 Otimista', color: 'border-emerald-500/50 bg-emerald-500/5', data: latestScenario.optimistic },
                  { key: 'realistic', label: '🔵 Realista', color: 'border-blue-500/50 bg-blue-500/5', data: latestScenario.realistic },
                  { key: 'pessimistic', label: '🔴 Pessimista', color: 'border-destructive/50 bg-destructive/5', data: latestScenario.pessimistic },
                ].map(s => (
                  <Card key={s.key} className={cn('border-2', s.color)}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{s.label}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {s.data ? (
                        <>
                          {s.data.revenue != null && <div><p className="text-xs text-muted-foreground">Receita</p><p className="text-lg font-bold">{fmt(s.data.revenue)}</p></div>}
                          {s.data.profit != null && <div><p className="text-xs text-muted-foreground">Lucro</p><p className="text-lg font-bold">{fmt(s.data.profit)}</p></div>}
                          {s.data.margin != null && <div><p className="text-xs text-muted-foreground">Margem</p><p className="text-lg font-bold">{s.data.margin}%</p></div>}
                          {s.data.description && <p className="text-xs text-muted-foreground">{s.data.description}</p>}
                          {s.data.key_actions?.map((a: string, i: number) => (
                            <p key={i} className="text-xs">• {a}</p>
                          ))}
                        </>
                      ) : <p className="text-xs text-muted-foreground">Dados indisponíveis</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
              {latestScenario.recommendations && Array.isArray(latestScenario.recommendations) && latestScenario.recommendations.length > 0 && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">📋 Recomendações Estratégicas</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {latestScenario.recommendations.map((r: string, i: number) => (
                        <li key={i} className="text-sm text-muted-foreground">• {r}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* ── Chat Tab ── */}
        <TabsContent value="chat">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2"><Brain className="h-4 w-4 text-primary" />CEO AI — Chat Gerencial</CardTitle>
                {messages.length > 0 && <Button variant="ghost" size="sm" onClick={clearChat} className="text-xs">Limpar</Button>}
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
              <ScrollArea className="flex-1 p-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12">
                    <Brain className="h-16 w-16 text-muted-foreground/20 mb-4" />
                    <p className="text-sm font-medium text-foreground mb-1">Pergunte ao CEO AI</p>
                    <p className="text-xs text-muted-foreground mb-6 max-w-sm">Faça perguntas estratégicas sobre a empresa usando dados reais do sistema</p>
                    <div className="grid gap-2 md:grid-cols-2 max-w-lg">
                      {quickQuestions.map(q => (
                        <Button key={q} variant="outline" size="sm" className="text-xs h-auto py-2 px-3 whitespace-normal text-left" onClick={() => sendMessage(q)}>
                          {q}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg, i) => (
                      <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                        <div className={cn('max-w-[80%] rounded-xl px-4 py-3 text-sm', msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                          {msg.role === 'assistant' ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                          ) : msg.content}
                        </div>
                      </div>
                    ))}
                    {chatLoading && messages[messages.length - 1]?.role === 'user' && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-xl px-4 py-3">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
              <div className="border-t p-3 flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Pergunte ao CEO AI..."
                  disabled={chatLoading}
                  className="flex-1"
                />
                <Button onClick={handleSend} disabled={chatLoading || !chatInput.trim()} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
