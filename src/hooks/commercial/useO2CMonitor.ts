import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type O2CStepKey = 'credit' | 'fiscal' | 'sefaz' | 'picking' | 'notify';
export const O2C_STEPS: O2CStepKey[] = ['credit', 'fiscal', 'sefaz', 'picking', 'notify'];

export interface O2CMonitorRow {
  step: O2CStepKey;
  running: number;
  ok: number;
  failed: number;
  skipped: number;
  avg_ms: number | null;
}

export interface O2CMonitorSnapshot {
  rows: O2CMonitorRow[];
  totalRuns: number;
  totalCompleted: number;
  totalFailed: number;
  windowDays: number;
  recentFailures: Array<{
    orderId: string;
    step: O2CStepKey;
    message: string | null;
    at: string;
  }>;
  sefazByHour: Array<{ hour: number; total: number; failed: number; rate: number }>;
  sefazFailureRate: number;
  topSefazCodes: Array<{ code: string; count: number; suggestion: string | null }>;
  sefazByWeek: Array<{ weekStart: string; total: number; failed: number; rate: number }>;
  bySeller: Array<{ sellerId: string; total: number; failed: number; rate: number }>;
}

interface EventRow {
  entity_id: string;
  event_type: string;
  payload: any;
  created_at: string;
}

export function useO2CMonitor(windowDays = 7, sellerId?: string | null) {
  return useQuery<O2CMonitorSnapshot>({
    queryKey: ['o2c-monitor', windowDays, sellerId ?? null],
    staleTime: 60_000,
    queryFn: async () => {
      const since = new Date(Date.now() - windowDays * 86_400_000).toISOString();
      const { data, error } = await (supabase as any)
        .from('cross_module_events')
        .select('entity_id, event_type, payload, created_at')
        .like('event_type', 'o2c.%')
        .gte('created_at', since)
        .order('created_at', { ascending: true })
        .limit(5000);
      if (error) throw error;
      const allRows = ((data ?? []) as unknown) as EventRow[];
      const rows = sellerId ? allRows.filter((r) => r.payload?.seller_id === sellerId) : allRows;

      // Agrupa por run_id (fallback: entity_id) e step
      const perStep: Record<O2CStepKey, { running: number; ok: number; failed: number; skipped: number; durations: number[] }> = {
        credit: { running: 0, ok: 0, failed: 0, skipped: 0, durations: [] },
        fiscal: { running: 0, ok: 0, failed: 0, skipped: 0, durations: [] },
        sefaz: { running: 0, ok: 0, failed: 0, skipped: 0, durations: [] },
        picking: { running: 0, ok: 0, failed: 0, skipped: 0, durations: [] },
        notify: { running: 0, ok: 0, failed: 0, skipped: 0, durations: [] },
      };

      const runStarts = new Map<string, number>();
      const runs = new Set<string>();
      const completedRuns = new Set<string>();
      const failedRuns = new Set<string>();
      const recentFailures: O2CMonitorSnapshot['recentFailures'] = [];
      const sefazHourly: Array<{ total: number; failed: number }> = Array.from(
        { length: 24 },
        () => ({ total: 0, failed: 0 })
      );

      for (const r of rows) {
        const [, step, status] = r.event_type.split('.') as [string, O2CStepKey, string];
        if (!(step in perStep)) continue;
        const runId = r.payload?.run_id ?? r.entity_id;
        runs.add(runId);
        const key = `${runId}:${step}`;
        if (status === 'running') {
          perStep[step].running += 1;
          runStarts.set(key, new Date(r.created_at).getTime());
        } else if (status === 'ok' || status === 'failed' || status === 'skipped') {
          (perStep[step] as any)[status] += 1;
          const startedAt = runStarts.get(key);
          if (startedAt) {
            perStep[step].durations.push(new Date(r.created_at).getTime() - startedAt);
            runStarts.delete(key);
          }
          if (step === 'sefaz' && (status === 'ok' || status === 'failed')) {
            const h = new Date(r.created_at).getHours();
            sefazHourly[h].total += 1;
            if (status === 'failed') sefazHourly[h].failed += 1;
          }
          if (status === 'failed') {
            failedRuns.add(runId);
            recentFailures.push({
              orderId: r.entity_id,
              step,
              message: r.payload?.message ?? null,
              at: r.created_at,
            });
          }
          if (step === 'notify' && status === 'ok') completedRuns.add(runId);
        }
      }

      const outRows: O2CMonitorRow[] = O2C_STEPS.map((step) => {
        const s = perStep[step];
        const avg = s.durations.length
          ? s.durations.reduce((a, b) => a + b, 0) / s.durations.length
          : null;
        return { step, running: s.running, ok: s.ok, failed: s.failed, skipped: s.skipped, avg_ms: avg };
      });

      const sefaz = perStep.sefaz;
      const sefazTotal = sefaz.ok + sefaz.failed;
      const sefazFailureRate = sefazTotal ? sefaz.failed / sefazTotal : 0;

      // Root-cause: top rejection codes + weekly evolution + by seller
      const codeAgg = new Map<string, { count: number; suggestion: string | null }>();
      const weekAgg = new Map<string, { total: number; failed: number }>();
      const sellerAgg = new Map<string, { total: number; failed: number }>();
      const weekStart = (iso: string) => {
        const d = new Date(iso);
        const day = d.getUTCDay();
        d.setUTCDate(d.getUTCDate() - day);
        d.setUTCHours(0, 0, 0, 0);
        return d.toISOString().slice(0, 10);
      };
      for (const r of rows) {
        const [, step, status] = r.event_type.split('.') as [string, string, string];
        if (step !== 'sefaz') continue;
        if (status !== 'ok' && status !== 'failed') continue;
        const ws = weekStart(r.created_at);
        const w = weekAgg.get(ws) ?? { total: 0, failed: 0 };
        w.total += 1;
        if (status === 'failed') w.failed += 1;
        weekAgg.set(ws, w);
        const sid = r.payload?.seller_id;
        if (sid) {
          const s = sellerAgg.get(sid) ?? { total: 0, failed: 0 };
          s.total += 1;
          if (status === 'failed') s.failed += 1;
          sellerAgg.set(sid, s);
        }
        if (status === 'failed') {
          const code = r.payload?.data?.code ?? r.payload?.code ?? 'sem-código';
          const c = codeAgg.get(code) ?? { count: 0, suggestion: r.payload?.data?.suggestion ?? null };
          c.count += 1;
          if (!c.suggestion && r.payload?.data?.suggestion) c.suggestion = r.payload.data.suggestion;
          codeAgg.set(code, c);
        }
      }

      return {
        rows: outRows,
        totalRuns: runs.size,
        totalCompleted: completedRuns.size,
        totalFailed: failedRuns.size,
        windowDays,
        recentFailures: recentFailures.slice(-25).reverse(),
        sefazByHour: sefazHourly.map((h, hour) => ({
          hour,
          total: h.total,
          failed: h.failed,
          rate: h.total ? h.failed / h.total : 0,
        })),
        sefazFailureRate,
        topSefazCodes: Array.from(codeAgg.entries())
          .map(([code, v]) => ({ code, count: v.count, suggestion: v.suggestion }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
        sefazByWeek: Array.from(weekAgg.entries())
          .map(([weekStart, v]) => ({ weekStart, total: v.total, failed: v.failed, rate: v.total ? v.failed / v.total : 0 }))
          .sort((a, b) => a.weekStart.localeCompare(b.weekStart)),
        bySeller: Array.from(sellerAgg.entries())
          .map(([sellerId, v]) => ({ sellerId, total: v.total, failed: v.failed, rate: v.total ? v.failed / v.total : 0 }))
          .sort((a, b) => b.failed - a.failed)
          .slice(0, 10),
      };
    },
  });
}
