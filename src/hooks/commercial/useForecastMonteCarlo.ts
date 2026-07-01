import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const STAGE_PROB: Record<string, number> = {
  lead: 0.10,
  opportunity: 0.30,
  proposal: 0.50,
  negotiation: 0.70,
  waiting_client: 0.85,
  approved: 1.0,
};

export interface MonteCarloResult {
  confirmed: number;
  p10: number;
  p50: number;
  p90: number;
  mean: number;
  stddev: number;
  histogram: { bucket: number; count: number }[];
  scenarios: number;
  pipelineCount: number;
}

// Deterministic RNG (mulberry32) so results are stable per period/seed
function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function useForecastMonteCarlo(period: string, scenarios = 2000) {
  return useQuery({
    queryKey: ['forecast-monte-carlo', period, scenarios],
    queryFn: async (): Promise<MonteCarloResult> => {
      const { data: pipeline } = await supabase
        .from('sales_funnel')
        .select('id, stage, value')
        .in('status', ['active', 'open'])
        .not('value', 'is', null);

      const startOfMonth = `${period}-01`;
      const { data: orders } = await supabase
        .from('orders')
        .select('total')
        .gte('date', startOfMonth)
        .in('status', ['confirmed', 'approved', 'invoiced', 'delivered']);

      const confirmed = (orders ?? []).reduce((s, o) => s + (o.total || 0), 0);
      const deals = (pipeline ?? []).map((p) => ({
        value: p.value || 0,
        prob: STAGE_PROB[p.stage] ?? 0.3,
      }));

      const seed = period.split('-').reduce((a, s) => a * 31 + Number(s), 7);
      const rand = mulberry32(seed);
      const totals: number[] = new Array(scenarios);
      for (let i = 0; i < scenarios; i++) {
        let sum = confirmed;
        for (const d of deals) if (rand() < d.prob) sum += d.value;
        totals[i] = sum;
      }
      totals.sort((a, b) => a - b);
      const pct = (p: number) => totals[Math.min(totals.length - 1, Math.floor(p * totals.length))];
      const mean = totals.reduce((s, v) => s + v, 0) / totals.length;
      const variance = totals.reduce((s, v) => s + (v - mean) ** 2, 0) / totals.length;

      // Histogram (20 buckets)
      const min = totals[0], max = totals[totals.length - 1];
      const buckets = 20;
      const step = (max - min) / buckets || 1;
      const histogram = Array.from({ length: buckets }, (_, i) => ({
        bucket: min + step * (i + 0.5),
        count: 0,
      }));
      for (const t of totals) {
        const idx = Math.min(buckets - 1, Math.floor((t - min) / step));
        histogram[idx].count++;
      }

      return {
        confirmed,
        p10: pct(0.10),
        p50: pct(0.50),
        p90: pct(0.90),
        mean,
        stddev: Math.sqrt(variance),
        histogram,
        scenarios,
        pipelineCount: deals.length,
      };
    },
    staleTime: 60_000,
  });
}
