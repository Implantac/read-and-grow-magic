import { useState, useMemo } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProductionOrders } from '@/hooks/useProductionOrders';
import { useProductCosts } from '@/hooks/useProductCosts';
import { useProductionCapacity } from '@/hooks/useProductionCapacity';
import { useAIProductionInsights } from '@/hooks/useAIProductionInsights';
import { Brain, TrendingUp, AlertTriangle, Lightbulb, Clock, Target, ArrowUp, ArrowDown, Minus, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter, ZAxis } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function MLPredictions() {
  const { orders } = useProductionOrders();
  const { costs } = useProductCosts();
  const { capacities } = useProductionCapacity();
  const { insights, loading: insightsLoading, refetch: refetchInsights } = useAIProductionInsights();
  const [generating, setGenerating] = useState(false);

  // Demand Forecast — aggregate orders by week
  const demandForecast = useMemo(() => {
    const weekMap: Record<string, number> = {};
    orders.forEach(o => {
      if (!o.created_at) return;
      const d = new Date(o.created_at);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().slice(0, 10);
      weekMap[key] = (weekMap[key] || 0) + o.quantity;
    });

    const sorted = Object.entries(weekMap).sort(([a], [b]) => a.localeCompare(b)).slice(-12);
    const data = sorted.map(([week, qty]) => ({ week: week.slice(5), qty }));

    // Simple moving average forecast
    if (data.length >= 3) {
      const last3 = data.slice(-3).reduce((s, d) => s + d.qty, 0) / 3;
      const trend = data.length >= 6 
        ? (data.slice(-3).reduce((s, d) => s + d.qty, 0) / 3 - data.slice(-6, -3).reduce((s, d) => s + d.qty, 0) / 3) 
        : 0;
      for (let i = 1; i <= 4; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i * 7);
        data.push({
          week: `${d.toISOString().slice(5, 10)}*`,
          qty: Math.max(0, Math.round(last3 + trend * i * 0.5)),
        });
      }
    }
    return data;
  }, [orders]);

  // Delay Risk Analysis
  const delayRisk = useMemo(() => {
    const activeOrders = orders.filter(o => ['planned', 'in_progress'].includes(o.status) && o.due_date);
    return activeOrders.map(o => {
      const daysRemaining = Math.ceil((new Date(o.due_date!).getTime() - Date.now()) / 86400000);
      const progress = o.quantity > 0 ? (o.produced_quantity / o.quantity) * 100 : 0;
      const estimatedDaysNeeded = o.estimated_time_minutes > 0
        ? Math.ceil((o.estimated_time_minutes * (1 - progress / 100)) / (8 * 60))
        : Math.ceil((o.quantity - o.produced_quantity) / 50);
      const riskScore = daysRemaining <= 0 ? 100 : daysRemaining < estimatedDaysNeeded ? 80 : daysRemaining < estimatedDaysNeeded * 1.5 ? 50 : 20;
      return {
        orderNumber: o.order_number,
        product: o.product_name,
        daysRemaining,
        progress,
        riskScore,
        riskLabel: riskScore >= 80 ? 'Alto' : riskScore >= 50 ? 'Médio' : 'Baixo',
      };
    }).sort((a, b) => b.riskScore - a.riskScore);
  }, [orders]);

  // Pattern Analysis — product × cost scatter
  const patternData = useMemo(() => {
    return costs.map(c => ({
      name: c.product_name.slice(0, 20),
      cost: c.total_cost,
      margin: c.profit_margin,
      revenue: c.sale_price,
    }));
  }, [costs]);

  // Optimization suggestions based on data
  const optimizations = useMemo(() => {
    const suggestions: { title: string; description: string; impact: string; type: 'improvement' | 'warning' | 'info' }[] = [];

    // Low margin products
    const lowMargin = costs.filter(c => c.profit_margin < 15);
    if (lowMargin.length > 0) {
      suggestions.push({
        title: `${lowMargin.length} produtos com margem abaixo de 15%`,
        description: `Produtos: ${lowMargin.slice(0, 3).map(c => c.product_name).join(', ')}. Revisar custos ou preços.`,
        impact: 'Potencial aumento de R$ ' + (lowMargin.reduce((s, c) => s + Math.abs(c.profit_value), 0)).toLocaleString('pt-BR', { minimumFractionDigits: 0 }),
        type: 'warning',
      });
    }

    // Overloaded sectors
    const overloaded = capacities.filter(c => c.current_load_pct > 90);
    if (overloaded.length > 0) {
      suggestions.push({
        title: `${overloaded.length} setores com carga > 90%`,
        description: `Setores: ${overloaded.map(c => c.sector).join(', ')}. Risco de gargalo.`,
        impact: 'Redistribuir carga pode reduzir lead time em 15-25%',
        type: 'warning',
      });
    }

    // Idle capacity
    const idle = capacities.filter(c => c.current_load_pct < 30 && c.is_active);
    if (idle.length > 0) {
      suggestions.push({
        title: `${idle.length} setores com capacidade ociosa`,
        description: `Setores: ${idle.map(c => c.sector).join(', ')}. Potencial para absorver mais produção.`,
        impact: 'Aproveitar capacidade ociosa para antecipar entregas',
        type: 'improvement',
      });
    }

    // Delayed orders
    const delayed = orders.filter(o => o.due_date && new Date(o.due_date) < new Date() && !['completed', 'cancelled'].includes(o.status));
    if (delayed.length > 0) {
      suggestions.push({
        title: `${delayed.length} OPs em atraso`,
        description: 'Priorizar estas ordens pode melhorar o indicador de On-Time Delivery.',
        impact: `Impacto em ${delayed.reduce((s, o) => s + o.quantity, 0)} unidades pendentes`,
        type: 'warning',
      });
    }

    if (suggestions.length === 0) {
      suggestions.push({
        title: 'Produção estável',
        description: 'Nenhum gargalo ou risco identificado nos dados atuais.',
        impact: 'Continue monitorando para manutenção preditiva.',
        type: 'info',
      });
    }

    return suggestions;
  }, [costs, capacities, orders]);

  const handleGenerateAIInsights = async () => {
    setGenerating(true);
    try {
      const { error } = await supabase.functions.invoke('ai-production', {
        body: { action: 'generate_insights' },
      });
      if (error) throw error;
      toast.success('Insights gerados pela IA!');
      refetchInsights();
    } catch (e) {
      toast.error('Erro ao gerar insights');
    } finally {
      setGenerating(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <PageContainer>
      <PageHeader
        title="🤖 Machine Learning — Predições Industriais"
        description="Previsão de demanda, risco de atraso, análise de padrões e sugestões de otimização"
      />

      <Tabs defaultValue="demand" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="demand">📈 Previsão Demanda</TabsTrigger>
          <TabsTrigger value="delay">⚠️ Risco de Atraso</TabsTrigger>
          <TabsTrigger value="patterns">🔍 Padrões</TabsTrigger>
          <TabsTrigger value="optimization">💡 Otimização</TabsTrigger>
          <TabsTrigger value="ai">🧠 IA Insights</TabsTrigger>
        </TabsList>

        {/* Demand Forecast */}
        <TabsContent value="demand">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Previsão de Demanda (Média Móvel + Tendência)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {demandForecast.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={demandForecast}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="week" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="qty"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary)/0.2)"
                      name="Quantidade"
                      strokeDasharray={(entry: any) => entry?.week?.includes('*') ? '5 5' : '0'}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">Dados insuficientes para previsão.</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">* Semanas com asterisco são previsões baseadas na tendência histórica.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delay Risk */}
        <TabsContent value="delay">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Análise de Risco de Atraso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {delayRisk.length > 0 ? delayRisk.map((r, i) => (
                  <div key={i} className="flex items-center gap-4 border rounded-lg p-3">
                    <div className={`text-2xl font-bold w-14 text-center ${getRiskColor(r.riskScore)}`}>
                      {r.riskScore}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{r.orderNumber}</span>
                        <Badge variant={r.riskScore >= 80 ? 'destructive' : r.riskScore >= 50 ? 'secondary' : 'outline'}>
                          {r.riskLabel}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{r.product}</p>
                    </div>
                    <div className="text-right text-xs">
                      <p>{r.daysRemaining <= 0 ? <span className="text-destructive font-bold">Atrasada</span> : `${r.daysRemaining}d restantes`}</p>
                      <p className="text-muted-foreground">Progresso: {r.progress.toFixed(0)}%</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-muted-foreground py-8">Nenhuma OP ativa com data de entrega.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pattern Analysis */}
        <TabsContent value="patterns">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Análise de Padrões: Custo × Margem</CardTitle>
            </CardHeader>
            <CardContent>
              {patternData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="cost" name="Custo" unit=" R$" className="text-xs" />
                    <YAxis dataKey="margin" name="Margem" unit="%" className="text-xs" />
                    <ZAxis dataKey="revenue" range={[50, 400]} name="Receita" unit=" R$" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter data={patternData} fill="hsl(var(--primary))" />
                  </ScatterChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">Cadastre custos de produtos para análise de padrões.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Optimization */}
        <TabsContent value="optimization">
          <div className="space-y-4">
            {optimizations.map((opt, i) => (
              <Card key={i} className={`border-l-4 ${opt.type === 'warning' ? 'border-l-yellow-500' : opt.type === 'improvement' ? 'border-l-green-500' : 'border-l-blue-500'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {opt.type === 'warning' ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                    ) : opt.type === 'improvement' ? (
                      <Lightbulb className="h-5 w-5 text-green-500 mt-0.5" />
                    ) : (
                      <Brain className="h-5 w-5 text-blue-500 mt-0.5" />
                    )}
                    <div>
                      <p className="font-semibold text-sm">{opt.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{opt.description}</p>
                      <p className="text-xs font-medium text-primary mt-2">💡 {opt.impact}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* AI Insights */}
        <TabsContent value="ai">
          <div className="mb-4">
            <Button onClick={handleGenerateAIInsights} disabled={generating}>
              {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Brain className="h-4 w-4 mr-2" />}
              Gerar Insights com IA
            </Button>
          </div>
          <div className="space-y-3">
            {insights.filter((i: any) => i.status === 'active').slice(0, 10).map((insight: any) => (
              <Card key={insight.id} className={`border-l-4 ${insight.severity === 'critical' ? 'border-l-red-500' : insight.severity === 'high' ? 'border-l-orange-500' : 'border-l-yellow-500'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm">{insight.title}</span>
                    <Badge variant={insight.severity === 'critical' ? 'destructive' : 'secondary'}>{insight.severity}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{insight.description}</p>
                  {insight.recommended_action && (
                    <p className="text-xs text-primary mt-2">➡️ {insight.recommended_action}</p>
                  )}
                </CardContent>
              </Card>
            ))}
            {insights.filter((i: any) => i.status === 'active').length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Clique em "Gerar Insights com IA" para análise preditiva.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
