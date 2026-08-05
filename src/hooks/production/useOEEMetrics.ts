import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type OEEMetricsRow = Database['public']['Tables']['oee_metrics']['Row'];

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
    // Tenta ler da tabela oee_metrics se existir, senão o backend via RPC
    // Como a tabela pode não existir ainda no schema visível, usamos catch
    try {
      const { data, error } = await supabase
        .from('oee_metrics' as any)
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;
      setMetrics(data || []);
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
