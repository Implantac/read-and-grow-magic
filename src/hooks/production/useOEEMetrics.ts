import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OEEMetrics {
  availability: number;
  performance: number;
  quality: number;
  oee: number;
  machine_id?: string | null;
  sector?: string | null;
  timestamp: string;
}

export function useOEEMetrics() {
  const [metrics, setMetrics] = useState<OEEMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('oee_metrics')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;
      setMetrics((data || []) as OEEMetrics[]);
    } catch (e) {
      console.warn('Tabela oee_metrics não encontrada, métricas serão calculadas on-the-fly');
      setMetrics([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, refetch: fetchMetrics };
}
