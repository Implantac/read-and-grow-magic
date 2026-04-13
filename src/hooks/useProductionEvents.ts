import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProductionEvent {
  id: string;
  event_type: string;
  source: string;
  entity_type: string | null;
  entity_id: string | null;
  entity_name: string | null;
  operator: string | null;
  sector: string | null;
  machine_id: string | null;
  payload: any;
  severity: string;
  processed: boolean;
  created_at: string;
}

export function useProductionEvents(limit = 50) {
  const [events, setEvents] = useState<ProductionEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('production_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) console.error(error);
    else setEvents(data || []);
    setLoading(false);
  }, [limit]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('production-events-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'production_events' }, (payload) => {
        setEvents(prev => [payload.new as ProductionEvent, ...prev].slice(0, limit));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [limit]);

  const emitEvent = useCallback(async (event: Partial<ProductionEvent>) => {
    const { error } = await (supabase as any).from('production_events').insert(event);
    if (error) console.error('Error emitting event:', error);
  }, []);

  const processQueue = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('production-events', {
      body: { action: 'process_queue' },
    });
    if (error) console.error(error);
    return data;
  }, []);

  const getAnalytics = useCallback(async (period: 'day' | 'week' | 'month' = 'day') => {
    const { data, error } = await supabase.functions.invoke('production-events', {
      body: { action: 'get_analytics', period },
    });
    if (error) console.error(error);
    return data;
  }, []);

  const todayEvents = events.filter(e => new Date(e.created_at).toDateString() === new Date().toDateString());
  const criticalEvents = events.filter(e => e.severity === 'critical' || e.severity === 'error');
  const unprocessed = events.filter(e => !e.processed);

  return {
    events, loading, refetch: fetchEvents, emitEvent,
    processQueue, getAnalytics,
    todayEvents, criticalEvents, unprocessed,
  };
}
