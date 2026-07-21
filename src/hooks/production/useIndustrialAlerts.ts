import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface IndustrialAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string | null;
  entity_type: string | null;
  entity_id: string | null;
  entity_name: string | null;
  metric_value: number | null;
  threshold_value: number | null;
  status: string;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
}

export function useIndustrialAlerts() {
  const [alerts, setAlerts] = useState<IndustrialAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('industrial_alerts').select('*').order('created_at', { ascending: false });
    if (error) console.error(error);
    else setAlerts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const createAlert = async (alert: Partial<IndustrialAlert>) => {
    const { error } = await supabase.from('industrial_alerts').insert(alert);
    if (error) return false;
    await fetchAlerts();
    return true;
  };

  const resolveAlert = async (id: string) => {
    const { error } = await supabase.from('industrial_alerts').update({
      status: 'resolved', resolved_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) { toast.error('Erro ao resolver alerta'); return; }
    toast.success('Alerta resolvido');
    await fetchAlerts();
  };

  const activeAlerts = alerts.filter(a => a.status === 'active');

  return { alerts, activeAlerts, loading, refetch: fetchAlerts, createAlert, resolveAlert };
}
