import { useState, useMemo } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProductionOrders } from '@/hooks/useProductionOrders';
import { useProductCosts } from '@/hooks/useProductCosts';
import { useProductionCapacity } from '@/hooks/useProductionCapacity';
import { useTimeEntries } from '@/hooks/useTimeEntries';
import { useAIProductionInsights } from '@/hooks/useAIProductionInsights';
import { Brain, TrendingUp, AlertTriangle, Lightbulb, Clock, Target, Loader2, BarChart3, ShieldAlert, Gauge, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter, ZAxis, ComposedChart, Line, Legend, Cell, ReferenceLine } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { differenceInMinutes, format, subDays } from 'date-fns';

export default function MLPredictions() {
  const { orders } = useProductionOrders();
  const { costs } = useProductCosts();
  const { capacities } = useProductionCapacity();
  const { entries } = useTimeEntries();
  const { insights, loading: insightsLoading, refetch: refetchInsights } = useAIProductionInsights();
  const [generating, setGenerating] = useState(false);

  // === Exponential Smoothing Forecast ===
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

    const sorted = Object.entries(weekMap).sort(([a], [b]) => a.localeCompare(b)).slice(-16);
    const data = sorted.map(([week, qty]) => ({ week: week.slice(5), qty, forecast: null as number | null, upper: null as number | null, lower: null as number | null }));

    if (data.length >= 4) {
      const alpha = 0.3;
      const beta = 0.1;
      let level = data[0].qty;
      let trend = 0;
      const errors: number[] = [];
      
      for (let i = 1; i < data.length; i++) {
        const prevLevel = level;
        level = alpha * data[i].qty + (1 - alpha) * (level + trend);
        trend = beta * (level - prevLevel) + (1 - beta) * trend;
        errors.push(Math.abs(data[i].qty - (prevLevel + trend)));
      }
      
      const mae = errors.length > 0 ? errors.reduce((s, e) => s + e, 0) / errors.length : 0;
      const confidenceMultiplier = 1.96;
      
      for (let i = 1; i <= 6; i++) {
        const forecastVal = Math.max(0, Math.round(level + trend * i));
        const confidence = mae * confidenceMultiplier * Math.sqrt(i);
        const d = new Date();
        d.setDate(d.getDate() + i * 7);
        data.push({
          week: `${d.toISOString().slice(5, 10)}*`,
          qty: 0,
          forecast: forecastVal,
          upper: Math.round(forecastVal + confidence),
          lower: Math.max(0, Math.round(forecastVal - confidence)),
        });
      }
    }
    return data;
  }, [orders]);

  // === Delay Risk Analysis with ML Score ===
  const delayRisk = useMemo(() => {
    const activeOrders = orders.filter(o => ['planned', 'in_progress'].includes(o.status) && o.due_date);
    return activeOrders.map(o => {
      const daysRemaining = Math.ceil((new Date(o.due_date!).getTime() - Date.now()) / 86400000);
      const progress = o.quantity > 0 ? (o.produced_quantity / o.quantity) * 100 : 0;
      const estimatedDaysNeeded = o.estimated_time_minutes > 0
        ? Math.ceil((o.estimated_time_minutes * (1 - progress / 100)) / (8 * 60))
        : Math.ceil((o.quantity - o.produced_quantity) / 50);
      
      // Multi-factor risk score
      const timeRisk = daysRemaining <= 0 ? 40 : daysRemaining < estimatedDaysNeeded ? 30 : daysRemaining < estimatedDaysNeeded * 1.5 ? 15 : 5;
      const progressRisk = progress < 20 && daysRemaining < estimatedDaysNeeded * 2 ? 20 : progress < 50 && daysRemaining < estimatedDaysNeeded ? 15 : 5;
      const priorityBonus = o.priority === 'urgent' ? 15 : o.priority === 'high' ? 10 : 0;
      const complexityRisk = o.quantity > 500 ? 10 : o.quantity > 200 ? 5 : 0;
      const rejectionRisk = o.rejected_quantity > 0 ? Math.min(15, (o.rejected_quantity / Math.max(o.produced_quantity, 1)) * 50) : 0;
      
      const riskScore = Math.min(100, timeRisk + progressRisk + priorityBonus + complexityRisk + rejectionRisk);
      const riskFactors: string[] = [];
      if (timeRisk >= 30) riskFactors.push('Prazo crítico');
      if (progressRisk >= 15) riskFactors.push('Progresso lento');
      if (rejectionRisk >= 10) riskFactors.push('Alta taxa refugo');
      if (complexityRisk >= 5) riskFactors.push('Volume alto');
      
      return {
        orderNumber: o.order_number,
        product: o.product_name,
        daysRemaining,
        progress,
        riskScore: +riskScore.toFixed(0),
        riskLabel: riskScore >= 70 ? 'Crítico' : riskScore >= 40 ? 'Alto' : riskScore >= 20 ? 'Médio' : 'Baixo',
        estimatedDaysNeeded,
        riskFactors,
        priority: o.priority,
      };
    }).sort((a, b) => b.riskScore - a.riskScore);
  }, [orders]);

  // === Anomaly Detection in Productivity ===
  const anomalies = useMemo(() => {
    const dailyProd: Record<string, { produced: number; hours: number; rejected: number }> = {};
    entries.filter(e => e.status === 'completed' && e.end_time).forEach(e => {
      const d = format(new Date(e.start_time), 'yyyy-MM-dd');
      if (!dailyProd[d]) dailyProd[d] = { produced: 0, hours: 0, rejected: 0 };
      dailyProd[d].produced += e.produced_quantity;
      dailyProd[d].hours += differenceInMinutes(new Date(e.end_time!), new Date(e.start_time)) / 60;
      dailyProd[d].rejected += e.rejected_quantity;
    });

    const entries_arr = Object.entries(dailyProd).sort(([a], [b]) => a.localeCompare(b)).slice(-30);
    const pcsH = entries_arr.map(([_, v]) => v.hours > 0 ? v.produced / v.hours : 0);
    const mean = pcsH.length > 0 ? pcsH.reduce((s, v) => s + v, 0) / pcsH.length : 0;
    const stdDev = pcsH.length > 1 ? Math.sqrt(pcsH.reduce((s, v) => s + (v - mean) ** 2, 0) / (pcsH.length - 1)) : 0;

    return entries_arr.map(([date, v], i) => {
      const rate = v.hours > 0 ? v.produced / v.hours : 0;
      const zScore = stdDev > 0 ? (rate - mean) / stdDev : 0;
      const isAnomaly = Math.abs(zScore) > 2;
      return {
        date: format(new Date(date), 'dd/MM'),
        rate: +rate.toFixed(1),
        produced: v.produced,
        rejected: v.rejected,
        zScore: +zScore.toFixed(2),
        isAnomaly,
        anomalyType: isAnomaly ? (zScore > 0 ? 'high' : 'low') : 'normal',
        mean: +mean.toFixed(1),
        upper: +(mean + 2 * stdDev).toFixed(1),
        lower: +Math.max(0, mean - 2 * stdDev).toFixed(1),
      };
    });
  }, [entries]);

  // === Optimization suggestions ===
  const optimizations = useMemo(() => {
    const suggestions: { title: string; description: string; impact: string; type: 'improvement' | 'warning' | 'info'; priority: number; kpi: string }[] = [];

    const lowMargin = costs.filter(c => c.profit_margin < 15);
    if (lowMargin.length > 0) {
      suggestions.push({
        title: `${lowMargin.length} produtos com margem abaixo de 15%`,
        description: `Produtos: ${lowMargin.slice(0, 3).map(c => c.product_name).join(', ')}. Revisar custos ou reajustar preços.`,
        impact: `Potencial: +${(lowMargin.reduce((s, c) => s + Math.abs(c.profit_value), 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
        type: 'warning', priority: 1, kpi: 'Margem',
      });
    }

    const overloaded = capacities.filter(c => c.current_load_pct > 90);
    if (overloaded.length > 0) {
      suggestions.push({
        title: `${overloaded.length} setores com carga > 90%`,
        description: `Setores: ${overloaded.map(c => c.sector).join(', ')}. Risco de gargalo e atraso.`,
        impact: 'Redistribuir carga: -15 a -25% no lead time',
        type: 'warning', priority: 2, kpi: 'Capacidade',
      });
    }

    const idle = capacities.filter(c => c.current_load_pct < 30 && c.is_active);
    if (idle.length > 0) {
      suggestions.push({
        title: `${idle.length} setores com capacidade ociosa (<30%)`,
        description: `Setores: ${idle.map(c => c.sector).join(', ')}. Absorver produção de setores sobrecarregados.`,
        impact: 'Antecipar entregas e melhorar On-Time Delivery',
        type: 'improvement', priority: 3, kpi: 'OTD',
      });
    }

    const delayed = orders.filter(o => o.due_date && new Date(o.due_date) < new Date() && !['completed', 'cancelled'].includes(o.status));
    if (delayed.length > 0) {
      suggestions.push({
        title: `${delayed.length} OPs em atraso ativo`,
        description: `Escalonar como urgentes e redistribuir recursos para recuperar prazos.`,
        impact: `${delayed.reduce((s, o) => s + o.quantity, 0)} unidades pendentes impactam faturamento`,
        type: 'warning', priority: 1, kpi: 'Entrega',
      });
    }

    const highReject = orders.filter(o => o.produced_quantity > 0 && (o.rejected_quantity / o.produced_quantity) > 0.1);
    if (highReject.length > 0) {
      suggestions.push({
        title: `${highReject.length} OPs com refugo > 10%`,
        description: `Investigar causas-raiz nos setores afetados. Possíveis problemas com insumos, calibração ou treinamento.`,
        impact: 'Reduzir refugo em 50% pode economizar em custo de materiais',
        type: 'warning', priority: 2, kpi: 'Qualidade',
      });
    }

    if (suggestions.length === 0) {
      suggestions.push({
        title: 'Produção estável — sem anomalias detectadas',
        description: 'Continue monitorando para manutenção preditiva e otimização contínua.',
        impact: 'Foco em melhoria contínua (Kaizen)',
        type: 'info', priority: 9, kpi: 'Geral',
      });
    }

    return suggestions.sort((a, b) => a.priority - b.priority);
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
    } catch {
      toast.error('Erro ao gerar insights');
    } finally {
      setGenerating(false);
    }
  };

  const criticalCount = delayRisk.filter(r => r.riskScore >= 70).length;
  const anomalyCount = anomalies.filter(a => a.isAnomaly).length;

  return (
    <PageContainer>
      <PageHeader
        title="🤖 Machine Learning — Predições Industriais"
        description="Previsão de demanda (Holt-Winters), risco de atraso multi-fator, detecção de anomalias e otimização"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Previsão Próximas 6 Semanas</p>
              <p className="text-xl font-bold">{demandForecast.filter(d => d.forecast).reduce((s, d) => s + (d.forecast || 0), 0).toLocaleString('pt-BR')} un</p>
            </div>
          </CardContent>
        </Card>
        <Card className={cn('border-l-4', criticalCount > 0 ? 'border-l-destructive' : 'border-l-success')}>
          <CardContent className="p-4 flex items-center gap-3">
            <ShieldAlert className={cn('h-8 w-8', criticalCount > 0 ? 'text-destructive' : 'text-success')} />
            <div>
              <p className="text-xs text-muted-foreground">Risco Crítico</p>
              <p className="text-xl font-bold">{criticalCount} OPs</p>
            </div>
          </CardContent>
        </Card>
        <Card className={cn('border-l-4', anomalyCount > 0 ? 'border-l-warning' : 'border-l-success')}>
          <CardContent className="p-4 flex items-center gap-3">
            <BarChart3 className={cn('h-8 w-8', anomalyCount > 0 ? 'text-warning' : 'text-success')} />
            <div>
              <p className="text-xs text-muted-foreground">Anomalias Detectadas</p>
              <p className="text-xl font-bold">{anomalyCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-chart-2">
          <CardContent className="p-4 flex items-center gap-3">
            <Lightbulb className="h-8 w-8 text-chart-2" />
            <div>
              <p className="text-xs text-muted-foreground">Sugestões de Otimização</p>
              <p className="text-xl font-bold">{optimizations.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="demand" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="demand">📈 Previsão Demanda</TabsTrigger>
          <TabsTrigger value="delay">⚠️ Risco de Atraso</TabsTrigger>
          <TabsTrigger value="anomalies">🔍 Anomalias</TabsTrigger>
          <TabsTrigger value="optimization">💡 Otimização</TabsTrigger>
          <TabsTrigger value="ai">🧠 IA Generativa</TabsTrigger>
        </TabsList>

        <TabsContent value="demand">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Previsão de Demanda — Suavização Exponencial (Holt-Winters) com Intervalo de Confiança 95%
              </CardTitle>
            </CardHeader>
            <CardContent>
              {demandForecast.length > 0 ? (
                <ResponsiveContainer width="100%" height={380}>
                  <ComposedChart data={demandForecast}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="upper" stroke="none" fill="hsl(var(--primary) / 0.1)" name="Limite Superior" />
                    <Area type="monotone" dataKey="lower" stroke="none" fill="hsl(var(--background))" name="Limite Inferior" />
                    <Bar dataKey="qty" name="Real" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                    <Line type="monotone" dataKey="forecast" name="Previsão" stroke="hsl(var(--chart-2))" strokeWidth={3} strokeDasharray="8 4" dot={{ r: 5 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">Dados insuficientes para previsão (mínimo 4 semanas).</p>
              )}
              <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                <span>🔵 Dados reais</span>
                <span>🟢 Previsão (Holt-Winters α=0.3, β=0.1)</span>
                <span>📊 Intervalo de confiança 95%</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delay">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Análise de Risco Multi-Fator (Tempo × Progresso × Complexidade × Qualidade)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {delayRisk.length > 0 ? (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="w-16">Score</TableHead>
                    <TableHead>OP</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead className="text-right">Prazo</TableHead>
                    <TableHead className="text-right">Progresso</TableHead>
                    <TableHead>Fatores de Risco</TableHead>
                    <TableHead>Risco</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {delayRisk.slice(0, 15).map((r, i) => (
                      <TableRow key={i} className={cn(r.riskScore >= 70 && 'bg-destructive/5')}>
                        <TableCell>
                          <div className={cn('text-xl font-bold text-center', r.riskScore >= 70 ? 'text-destructive' : r.riskScore >= 40 ? 'text-warning' : 'text-success')}>
                            {r.riskScore}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{r.orderNumber}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{r.product}</TableCell>
                        <TableCell><Badge variant={r.priority === 'urgent' ? 'destructive' : 'outline'} className="text-xs">{r.priority}</Badge></TableCell>
                        <TableCell className="text-right">{r.daysRemaining <= 0 ? <span className="text-destructive font-bold">Atrasada</span> : `${r.daysRemaining}d`}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Progress value={r.progress} className="w-16 h-2" />
                            <span className="text-xs">{r.progress.toFixed(0)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {r.riskFactors.map((f, j) => <Badge key={j} variant="outline" className="text-xs">{f}</Badge>)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={r.riskScore >= 70 ? 'destructive' : r.riskScore >= 40 ? 'secondary' : 'outline'}>
                            {r.riskLabel}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhuma OP ativa com data de entrega.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anomalies">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Detecção de Anomalias — Controle Estatístico (Z-Score ± 2σ)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {anomalies.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={350}>
                    <ComposedChart data={anomalies}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={10} />
                      <YAxis fontSize={11} />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="upper" stroke="none" fill="hsl(var(--destructive) / 0.08)" name="Lim. Superior (2σ)" />
                      <Area type="monotone" dataKey="lower" stroke="none" fill="transparent" name="Lim. Inferior (2σ)" />
                      <Line type="monotone" dataKey="mean" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" strokeWidth={1} name="Média" dot={false} />
                      <Bar dataKey="rate" name="Peças/h">
                        {anomalies.map((entry, i) => (
                          <Cell key={i} fill={entry.isAnomaly ? (entry.anomalyType === 'high' ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))') : 'hsl(var(--primary))'} />
                        ))}
                      </Bar>
                    </ComposedChart>
                  </ResponsiveContainer>

                  {anomalyCount > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium">Anomalias Identificadas:</p>
                      {anomalies.filter(a => a.isAnomaly).map((a, i) => (
                        <div key={i} className={cn('p-3 rounded-lg text-sm flex items-center gap-3', a.anomalyType === 'low' ? 'bg-destructive/10' : 'bg-chart-2/10')}>
                          {a.anomalyType === 'low' ? <ArrowDownRight className="h-4 w-4 text-destructive" /> : <ArrowUpRight className="h-4 w-4 text-chart-2" />}
                          <span><strong>{a.date}</strong>: {a.rate} peças/h (Z={a.zScore}) — {a.anomalyType === 'low' ? 'Produtividade anormalmente baixa' : 'Pico atípico de produtividade'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-muted-foreground py-8">Dados insuficientes para análise estatística.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization">
          <div className="space-y-4">
            {optimizations.map((opt, i) => (
              <Card key={i} className={cn('border-l-4', opt.type === 'warning' ? 'border-l-warning' : opt.type === 'improvement' ? 'border-l-success' : 'border-l-primary')}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={cn('rounded-full p-2', opt.type === 'warning' ? 'bg-warning/10' : opt.type === 'improvement' ? 'bg-success/10' : 'bg-primary/10')}>
                      {opt.type === 'warning' ? <AlertTriangle className="h-5 w-5 text-warning" /> : opt.type === 'improvement' ? <Lightbulb className="h-5 w-5 text-success" /> : <Brain className="h-5 w-5 text-primary" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{opt.title}</p>
                        <Badge variant="outline" className="text-xs">{opt.kpi}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{opt.description}</p>
                      <p className="text-sm font-medium text-primary mt-2">💡 {opt.impact}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ai">
          <div className="mb-4">
            <Button onClick={handleGenerateAIInsights} disabled={generating} size="lg">
              {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Brain className="h-4 w-4 mr-2" />}
              Gerar Insights com IA Generativa
            </Button>
          </div>
          <div className="space-y-3">
            {insights.filter((i: any) => i.status === 'active').slice(0, 10).map((insight: any) => (
              <Card key={insight.id} className={cn('border-l-4', insight.severity === 'critical' ? 'border-l-destructive' : insight.severity === 'high' ? 'border-l-warning' : 'border-l-primary')}>
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
                Clique em "Gerar Insights com IA Generativa" para análise preditiva avançada.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
