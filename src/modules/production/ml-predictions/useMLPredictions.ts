import { useMemo } from 'react';
import { differenceInMinutes, format } from 'date-fns';
import { useProductionOrders } from '@/hooks/production/useProductionOrders';
import { useProductCosts } from '@/hooks/production/useProductCosts';
import { useProductionCapacity } from '@/hooks/production/useProductionCapacity';
import { useTimeEntries } from '@/hooks/system/useTimeEntries';
import { formatBRL } from '@/lib/formatters';

export type OptimizationSuggestion = {
  title: string;
  description: string;
  impact: string;
  type: 'improvement' | 'warning' | 'info';
  priority: number;
  kpi: string;
};

export function useMLPredictions() {
  const { orders } = useProductionOrders();
  const { costs } = useProductCosts();
  const { capacities } = useProductionCapacity();
  const { entries } = useTimeEntries();

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
    const data = sorted.map(([week, qty]) => ({
      week: week.slice(5), qty,
      forecast: null as number | null, upper: null as number | null, lower: null as number | null,
    }));

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

  const delayRisk = useMemo(() => {
    const activeOrders = orders.filter(o => ['planned', 'in_progress'].includes(o.status) && o.due_date);
    return activeOrders.map(o => {
      const daysRemaining = Math.ceil((new Date(o.due_date!).getTime() - Date.now()) / 86400000);
      const progress = o.quantity > 0 ? (o.produced_quantity / o.quantity) * 100 : 0;
      const estimatedDaysNeeded = o.estimated_time_minutes > 0
        ? Math.ceil((o.estimated_time_minutes * (1 - progress / 100)) / (8 * 60))
        : Math.ceil((o.quantity - o.produced_quantity) / 50);

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

    return entries_arr.map(([date, v]) => {
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

  const optimizations = useMemo<OptimizationSuggestion[]>(() => {
    const suggestions: OptimizationSuggestion[] = [];

    const lowMargin = costs.filter(c => c.profit_margin < 15);
    if (lowMargin.length > 0) {
      suggestions.push({
        title: `${lowMargin.length} produtos com margem abaixo de 15%`,
        description: `Produtos: ${lowMargin.slice(0, 3).map(c => c.product_name).join(', ')}. Revisar custos ou reajustar preços.`,
        impact: `Potencial: +${formatBRL(lowMargin.reduce((s, c) => s + Math.abs(c.profit_value), 0))}`,
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

  return { demandForecast, delayRisk, anomalies, optimizations };
}

export type DemandForecast = ReturnType<typeof useMLPredictions>['demandForecast'];
export type DelayRisk = ReturnType<typeof useMLPredictions>['delayRisk'];
export type Anomalies = ReturnType<typeof useMLPredictions>['anomalies'];
