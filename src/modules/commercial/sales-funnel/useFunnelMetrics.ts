import { useMemo } from 'react';
import { differenceInDays } from 'date-fns';
import { FUNNEL_STAGES, type DbFunnelItem } from '@/hooks/commercial/useSalesFunnel';

export const KANBAN_STAGES = FUNNEL_STAGES.slice(0, 6);

export function useFunnelMetrics(funnel: DbFunnelItem[]) {
  const stats = useMemo(() => {
    const open = funnel.filter(f => f.status === 'open');
    const totalValue = open.reduce((s, f) => s + f.value, 0);
    const weightedValue = open.reduce((s, f) => s + (f.value * f.probability / 100), 0);
    const won = funnel.filter(f => f.status === 'won');
    const lost = funnel.filter(f => f.status === 'lost');
    const wonValue = won.reduce((s, f) => s + f.value, 0);
    const conversionRate = (won.length + lost.length) > 0 ? (won.length / (won.length + lost.length)) * 100 : 0;
    return { openCount: open.length, totalValue, weightedValue, wonValue, conversionRate, wonCount: won.length, lostCount: lost.length };
  }, [funnel]);

  const stageMetrics = useMemo(() => {
    const now = new Date();
    return FUNNEL_STAGES.map((stage, idx) => {
      const inStage = funnel.filter(f => f.stage === stage.value && f.status === 'open');
      const value = inStage.reduce((s, f) => s + f.value, 0);
      const avgDays = inStage.length > 0
        ? inStage.reduce((s, f) => s + differenceInDays(now, new Date(f.updated_at || f.created_at)), 0) / inStage.length
        : 0;
      const pastStage = funnel.filter(f => {
        const fIdx = FUNNEL_STAGES.findIndex(s => s.value === f.stage);
        return fIdx > idx || f.status === 'won';
      });
      const enteredStage = funnel.filter(f => {
        const fIdx = FUNNEL_STAGES.findIndex(s => s.value === f.stage);
        return fIdx >= idx || f.status === 'won' || f.status === 'lost';
      });
      const stageConversion = enteredStage.length > 0 ? (pastStage.length / enteredStage.length) * 100 : 0;
      return { ...stage, count: inStage.length, totalValue: value, avgDays: Math.round(avgDays), stageConversion: Math.round(stageConversion) };
    });
  }, [funnel]);

  const stagnantItems = useMemo(() => {
    const now = new Date();
    return funnel.filter(f => {
      if (f.status !== 'open') return false;
      return differenceInDays(now, new Date(f.updated_at || f.created_at)) > 14;
    }).sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
  }, [funnel]);

  const grouped = useMemo(() => {
    const map: Record<string, DbFunnelItem[]> = {};
    KANBAN_STAGES.forEach(s => { map[s.value] = []; });
    funnel.filter(f => f.status === 'open').forEach(f => {
      if (map[f.stage]) map[f.stage].push(f);
    });
    return map;
  }, [funnel]);

  const funnelChartData = useMemo(() => {
    return FUNNEL_STAGES.map(stage => {
      const items = funnel.filter(f => f.stage === stage.value && f.status === 'open');
      return { name: stage.label, count: items.length, value: items.reduce((s, f) => s + f.value, 0) };
    }).filter(d => d.count > 0);
  }, [funnel]);

  return { stats, stageMetrics, stagnantItems, grouped, funnelChartData };
}
