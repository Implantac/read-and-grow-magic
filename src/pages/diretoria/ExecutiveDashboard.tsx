import { useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Brain, TrendingUp, TrendingDown, DollarSign, AlertTriangle, Users,
  Package, RefreshCw, Send, MessageSquare, Lightbulb, ShieldAlert, BarChart3,
  ArrowUpRight, ArrowDownRight, Target, Wallet, PieChart,
} from 'lucide-react';
import { useExecutiveDashboard, useGenerateInsights, useExecutiveChat } from '@/hooks/useExecutiveAI';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, PieChart as RPieChart, Pie } from 'recharts';
import ReactMarkdown from 'react-markdown';

const fmt = (v: number) => v >= 1000000
  ? `R$ ${(v / 1000000).toFixed(1)}M`
  : v >= 1000
    ? `R$ ${(v / 1000).toFixed(0)}k`
    : `R$ ${v.toFixed(0)}`;

const severityColor: Record<string, string> = {
  critical: 'bg-destructive text-destructive-foreground',
  high: 'bg-warning text-warning-foreground',
  medium: 'bg-info/20 text-info',
  low: 'bg-muted text-muted-foreground',
};

const insightIcon: Record<string, any> = {
  revenue: TrendingUp,
  profit: DollarSign,
  cost: Wallet,
  risk: ShieldAlert,
  operational: Package,
  commercial: Users,
};

export default function ExecutiveDashboard() {
  const { data, isLoading } = useExecutiveDashboard();
  const generateInsights = useGenerateInsights();
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
          {[1, 2, 3, 4].map(i => <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>)}
        </div>
      </PageContainer>
    );
  }

  const kpis = data?.kpis;
  const revenueByMonth = data?.revenueByMonth || [];
  const topClients = data?.topClients || [];
  const insights = data?.insights || [];
  const expenseByCategory = data?.expenseByCategory || {};

  const expenseData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  const COLORS = ['hsl(var(--primary))', 'hsl(var(--info))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--muted-foreground))'];

  const kpiCards = [
    { label: 'Receita Total', value: fmt(kpis?.totalRevenue || 0), icon: TrendingUp, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Lucro Bruto', value: fmt(kpis?.grossProfit || 0), icon: DollarSign, color: 'text-primary', bg: 'bg-primary/10', sub: `Margem ${kpis?.grossMargin || 0}%` },
    { label: 'Inadimplência', value: fmt(kpis?.overdueReceivable || 0), icon: AlertTriangle, color: kpis?.defaultRate && kpis.defaultRate > 10 ? 'text-destructive' : 'text-warning', bg: kpis?.defaultRate && kpis.defaultRate > 10 ? 'bg-destructive/10' : 'bg-warning/10', sub: `${kpis?.defaultRate || 0}% da carteira` },
    { label: 'Posição Líquida', value: fmt(kpis?.netPosition || 0), icon: Wallet, color: (kpis?.netPosition || 0) >= 0 ? 'text-success' : 'text-destructive', bg: (kpis?.netPosition || 0) >= 0 ? 'bg-success/10' : 'bg-destructive/10' },
  ];

  const quickQuestions = [
    'Como está o desempenho da empresa?',
    'Onde estamos perdendo dinheiro?',
    'Quais clientes estão em risco?',
    'O que fazer para aumentar lucro?',
  ];

  return (
    <PageContainer>
      <PageHeader
        title="🧠 IA Executiva"
        description="Visão estratégica consolidada com inteligência artificial"
        actions={
          <Button
            onClick={() => generateInsights.mutate()}
            disabled={generateInsights.isPending}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Brain className={cn('h-4 w-4', generateInsights.isPending && 'animate-spin')} />
            Gerar Insights
          </Button>
        }
      />

      {/* KPI Cards */}
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

      {/* Secondary KPIs */}
      <div className="grid gap-3 md:grid-cols-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Users className="h-4 w-4 text-primary" />
          <div><p className="text-xs text-muted-foreground">Clientes Ativos</p><p className="text-lg font-bold">{kpis?.activeClients || 0}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Package className="h-4 w-4 text-warning" />
          <div><p className="text-xs text-muted-foreground">Estoque Baixo</p><p className="text-lg font-bold">{kpis?.lowStockProducts || 0}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <ArrowDownRight className="h-4 w-4 text-info" />
          <div><p className="text-xs text-muted-foreground">A Receber</p><p className="text-lg font-bold">{fmt(kpis?.totalReceivable || 0)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <ArrowUpRight className="h-4 w-4 text-destructive" />
          <div><p className="text-xs text-muted-foreground">A Pagar</p><p className="text-lg font-bold">{fmt(kpis?.totalPayable || 0)}</p></div>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList>
          <TabsTrigger value="insights" className="gap-1.5"><Lightbulb className="h-3.5 w-3.5" />Insights</TabsTrigger>
          <TabsTrigger value="charts" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" />Análises</TabsTrigger>
          <TabsTrigger value="chat" className="gap-1.5"><MessageSquare className="h-3.5 w-3.5" />Chat Gerencial</TabsTrigger>
        </TabsList>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          {insights.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Brain className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">Clique em "Gerar Insights" para a IA analisar seus dados</p>
              </CardContent>
            </Card>
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
                        <Badge className={cn('text-[10px]', severityColor[ins.severity] || severityColor.medium)}>
                          {ins.severity}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-xs text-muted-foreground">{ins.description}</p>
                      {ins.explanation && (
                        <div className="rounded-md bg-muted/50 p-2">
                          <p className="text-xs font-medium text-foreground/80">💡 {ins.explanation}</p>
                        </div>
                      )}
                      {ins.impact_estimate && (
                        <p className="text-xs text-primary font-medium">📊 Impacto: {ins.impact_estimate}</p>
                      )}
                      {ins.recommended_actions?.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium">Ações recomendadas:</p>
                          {ins.recommended_actions.map((a: string, i: number) => (
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

        {/* Charts Tab */}
        <TabsContent value="charts" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Revenue Trend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success" />Receita Mensal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{ revenue: { label: 'Receita', color: 'hsl(var(--success))' } }} className="h-[250px]">
                  <BarChart data={revenueByMonth}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent formatter={(v) => fmt(Number(v))} />} />
                    <Bar dataKey="revenue" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Top Clients */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />Top Clientes
                  {kpis?.concentrationPct && kpis.concentrationPct > 50 && (
                    <Badge variant="destructive" className="text-[10px]">Concentração {kpis.concentrationPct}%</Badge>
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
                </div>
              </CardContent>
            </Card>

            {/* Expenses Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><PieChart className="h-4 w-4 text-warning" />Despesas por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[250px]">
                  <RPieChart>
                    <Pie data={expenseData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {expenseData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent formatter={(v) => fmt(Number(v))} />} />
                  </RPieChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Risk Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-destructive" />Painel de Riscos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RiskItem label="Inadimplência" value={`${kpis?.defaultRate || 0}%`} threshold={10} current={kpis?.defaultRate || 0} />
                <RiskItem label="Concentração Top3" value={`${kpis?.concentrationPct || 0}%`} threshold={50} current={kpis?.concentrationPct || 0} />
                <RiskItem label="Produtos Críticos" value={`${kpis?.lowStockProducts || 0}`} threshold={5} current={kpis?.lowStockProducts || 0} />
                <RiskItem label="Vencidos a Pagar" value={fmt(kpis?.overduePayable || 0)} threshold={10000} current={kpis?.overduePayable || 0} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />CEO AI — Chat Gerencial
                </CardTitle>
                {messages.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearChat} className="text-xs">Limpar</Button>
                )}
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
                        <div className={cn(
                          'max-w-[80%] rounded-xl px-4 py-3 text-sm',
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}>
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
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Pergunte sobre a empresa..."
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  disabled={chatLoading}
                  className="text-sm"
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

function RiskItem({ label, value, threshold, current }: { label: string; value: string; threshold: number; current: number }) {
  const isRisk = current >= threshold;
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={cn('w-2 h-2 rounded-full', isRisk ? 'bg-destructive' : 'bg-success')} />
        <span className="text-sm">{label}</span>
      </div>
      <span className={cn('text-sm font-bold tabular-nums', isRisk ? 'text-destructive' : 'text-foreground')}>{value}</span>
    </div>
  );
}
