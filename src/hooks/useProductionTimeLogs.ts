import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProductionTimeLog {
  id: string;
  order_id: string;
  action: string;
  started_at: string | null;
  paused_at: string | null;
  finished_at: string | null;
  elapsed_seconds: number;
  operator: string | null;
  notes: string | null;
  created_at: string;
}

export function useProductionTimeLogs(orderId?: string) {
  const [logs, setLogs] = useState<ProductionTimeLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    let query = (supabase as any).from('production_time_logs').select('*').order('created_at', { ascending: false });
    if (orderId) query = query.eq('order_id', orderId);
    else query = query.limit(500);
    const { data, error } = await query;
    if (error) console.error(error);
    else setLogs(data || []);
    setLoading(false);
  }, [orderId]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const getActiveLog = useCallback((oid: string) => {
    return logs.find(l => l.order_id === oid && l.action === 'start' && !l.finished_at && !l.paused_at);
  }, [logs]);

  const getPausedLog = useCallback((oid: string) => {
    return logs.find(l => l.order_id === oid && l.action === 'pause' && !l.finished_at);
  }, [logs]);

  const getLastLog = useCallback((oid: string) => {
    return logs.find(l => l.order_id === oid);
  }, [logs]);

  const startTimer = async (oid: string, operator?: string) => {
    const active = getActiveLog(oid);
    if (active) { toast.info('Timer já está ativo para esta OP'); return; }
    
    const { error } = await (supabase as any).from('production_time_logs').insert({
      order_id: oid,
      action: 'start',
      started_at: new Date().toISOString(),
      operator: operator || null,
    });
    if (error) { toast.error('Erro ao iniciar timer'); console.error(error); return; }
    toast.success('Timer iniciado');
    await fetchLogs();
  };

  const pauseTimer = async (oid: string) => {
    const active = getActiveLog(oid);
    if (!active) { toast.info('Nenhum timer ativo para pausar'); return; }

    const startedAt = new Date(active.started_at!);
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - startedAt.getTime()) / 1000) + active.elapsed_seconds;

    const { error } = await (supabase as any).from('production_time_logs').update({
      action: 'pause',
      paused_at: now.toISOString(),
      elapsed_seconds: elapsed,
    }).eq('id', active.id);

    if (error) { toast.error('Erro ao pausar timer'); console.error(error); return; }
    toast.success('Timer pausado');
    await fetchLogs();
  };

  const resumeTimer = async (oid: string) => {
    const paused = getPausedLog(oid);
    if (!paused) { toast.info('Nenhum timer pausado'); return; }

    const { error } = await (supabase as any).from('production_time_logs').update({
      action: 'start',
      started_at: new Date().toISOString(),
      paused_at: null,
    }).eq('id', paused.id);

    if (error) { toast.error('Erro ao retomar timer'); console.error(error); return; }
    toast.success('Timer retomado');
    await fetchLogs();
  };

  const finishTimer = async (oid: string) => {
    const active = getActiveLog(oid);
    const paused = getPausedLog(oid);
    const log = active || paused;
    if (!log) { toast.info('Nenhum timer ativo/pausado'); return; }

    let elapsed = log.elapsed_seconds;
    if (active && active.started_at) {
      elapsed += Math.floor((new Date().getTime() - new Date(active.started_at).getTime()) / 1000);
    }

    const { error } = await (supabase as any).from('production_time_logs').update({
      action: 'finish',
      finished_at: new Date().toISOString(),
      elapsed_seconds: elapsed,
    }).eq('id', log.id);

    if (error) { toast.error('Erro ao finalizar timer'); console.error(error); return; }
    toast.success(`Timer finalizado — ${formatElapsed(elapsed)}`);
    await fetchLogs();
  };

  const getTotalElapsed = useCallback((oid: string) => {
    return logs
      .filter(l => l.order_id === oid && l.action === 'finish')
      .reduce((sum, l) => sum + l.elapsed_seconds, 0);
  }, [logs]);

  return { logs, loading, refetch: fetchLogs, getActiveLog, getPausedLog, getLastLog, startTimer, pauseTimer, resumeTimer, finishTimer, getTotalElapsed };
}

export function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h${m.toString().padStart(2, '0')}m`;
  return `${m}m${s.toString().padStart(2, '0')}s`;
}
