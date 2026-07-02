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
}

interface EventRow {
  entity_id: string;
  event_type: string;
  payload: any;
  created_at: string;
}

export function useO2CMonitor(windowDays = 7) {
  return useQuery<O2CMonitorSnapshot>({
    queryKey: ['o2c-monitor', windowDays],
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
      const rows = ((data ?? []) as unknown) as EventRow[];

      // Agrupa por run_id (fallback: entity_id) e step
      const perStep: Record<O2CStepKey, { running: number; ok: number; failed: number; skipped: number; durations: number[] }> = {
        credit: { running: 0, ok: 0, failed: 0, skipped: 0, durations: [] },
        fiscal: { running: 0, ok: 0, failed: 0, skipped: 0, durations: [] },
        sefaz: { running: 0, ok: 0, failed: 0, skipped: 0, durations: [] },
        picking: { running: 0, ok: 0, failed: 0, skipped: 0, durations: [] },
        notify: { running: 0, ok: 0, failed: 0, skipped: 0, durations: [] },
      };

      const runStarts = new Map<string, number>(); // runId+step → startedAt
      const runs = new Set<string>();
      const completedRuns = new Set<string>();
      const failedRuns = new Set<string>();
      const recentFailures: O2CMonitorSnapshot['recentFailures'] = [];

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

      return {
        rows: outRows,
        totalRuns: runs.size,
        totalCompleted: completedRuns.size,
        totalFailed: failedRuns.size,
        windowDays,
        recentFailures: recentFailures.slice(-25).reverse(),
      };
    },
  });
}
