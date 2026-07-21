import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProductionLogRow {
  id: string;
  production_order_id: string | null;
  step_id: string | null;
  event_type: string;
  operator: string | null;
  quantity: number;
  description: string | null;
  metadata: any;
  created_at: string;
}

export function useProductionLogs(orderId?: string) {
  const [logs, setLogs] = useState<ProductionLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('production_logs').select('*').order('created_at', { ascending: false }).limit(200);
    if (orderId) query = query.eq('production_order_id', orderId);
    const { data, error } = await query;
    if (error) { console.error(error); }
    else setLogs(data || []);
    setLoading(false);
  }, [orderId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addLog = async (log: Partial<ProductionLogRow>) => {
    const { error } = await supabase.from('production_logs').insert(log as any);
    if (error) console.error('Erro ao registrar log', error);
    else await fetchData();
  };

  return { logs, loading, refetch: fetchData, addLog };
}
