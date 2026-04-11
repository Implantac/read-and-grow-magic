import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface WMSAIInsight {
  id: string;
  insightType: string;
  category: string;
  title: string;
  description: string | null;
  severity: string;
  dataPoints: Record<string, unknown> | null;
  recommendedActions: string[] | null;
  affectedProducts: string[] | null;
  affectedLocations: string[] | null;
  status: string;
  createdAt: string;
  expiresAt: string | null;
}

export function useWMSAIInsights() {
  const [insights, setInsights] = useState<WMSAIInsight[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wms_ai_insights')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setInsights((data || []).map(r => ({
        id: r.id,
        insightType: r.insight_type,
        category: r.category,
        title: r.title,
        description: r.description,
        severity: r.severity,
        dataPoints: r.data_points as Record<string, unknown> | null,
        recommendedActions: r.recommended_actions as string[] | null,
        affectedProducts: r.affected_products as string[] | null,
        affectedLocations: r.affected_locations as string[] | null,
        status: r.status,
        createdAt: r.created_at,
        expiresAt: r.expires_at,
      })));
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar insights');
    } finally {
      setLoading(false);
    }
  }, []);

  const dismiss = async (id: string) => {
    try {
      const { error } = await supabase.from('wms_ai_insights').update({
        status: 'dismissed',
        dismissed_at: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { fetchData(); }, [fetchData]);
  return { insights, loading, refetch: fetchData, dismiss };
}
