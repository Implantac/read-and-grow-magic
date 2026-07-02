import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type O2CStepKey = 'credit' | 'fiscal' | 'sefaz' | 'picking' | 'notify';
export type O2CStepStatus = 'running' | 'ok' | 'failed' | 'skipped';

export interface O2CStepEvent {
  step: O2CStepKey;
  status: O2CStepStatus;
  message?: string;
  data?: Record<string, unknown>;
  at: string;
}

const STEP_ORDER: O2CStepKey[] = ['credit', 'fiscal', 'sefaz', 'picking', 'notify'];

export function useO2COrchestrator(orderId: string | null) {
  const [running, setRunning] = useState(false);
  const [events, setEvents] = useState<O2CStepEvent[]>([]);
  const [runId, setRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const trigger = useCallback(async () => {
    if (!orderId) return;
    setRunning(true);
    setError(null);
    setEvents([]);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('o2c-orchestrator', {
        body: { order_id: orderId },
      });
      if (fnErr) throw fnErr;
      setRunId((data as any)?.run_id ?? null);
      const results = ((data as any)?.results ?? []) as O2CStepEvent[];
      setEvents(results.map((r) => ({ ...r, at: new Date().toISOString() })));
    } catch (e: any) {
      setError(e?.message ?? 'Falha ao executar Order-to-Cash');
    } finally {
      setRunning(false);
    }
  }, [orderId]);

  // Realtime: capta eventos do orquestrador para este pedido
  useEffect(() => {
    if (!orderId) return;
    const channel = supabase
      .channel(`o2c-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cross_module_events',
          filter: `entity_id=eq.${orderId}`,
        },
        (payload) => {
          const row: any = payload.new;
          const step = row?.payload?.step as O2CStepKey | undefined;
          const status = row?.payload?.status as O2CStepStatus | undefined;
          if (!step || !status) return;
          setEvents((prev) => [
            ...prev,
            {
              step,
              status,
              message: row?.payload?.message,
              data: row?.payload?.data,
              at: row?.created_at ?? new Date().toISOString(),
            },
          ]);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  return { trigger, running, events, runId, error, stepOrder: STEP_ORDER };
}
