import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AIProductionInsight {
  id: string;
  insight_type: string;
  severity: string;
  title: string;
  description: string | null;
  affected_order_id: string | null;
  affected_sector: string | null;
  recommended_action: string | null;
  status: string;
  impact_estimate: string | null;
  resolved_at: string | null;
  created_at: string;
}

export function useAIProductionInsights() {
  const [insights, setInsights] = useState<AIProductionInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('ai_production_insights').select('*').order('created_at', { ascending: false }).limit(50);
    if (error) console.error(error);
    else setInsights(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const generateInsights = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-production', {
        body: { action: 'generate_insights' },
      });
      if (error) throw error;
      toast.success('Insights gerados pela IA');
      await fetchData();
    } catch (e: any) {
      console.error(e);
      toast.error('Erro ao gerar insights: ' + (e.message || ''));
    }
    setGenerating(false);
  };

  const resolveInsight = async (id: string) => {
    const { error } = await supabase.from('ai_production_insights').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', id);
    if (error) toast.error('Erro ao resolver');
    else { toast.success('Insight resolvido'); await fetchData(); }
  };

  return { insights, loading, generating, generateInsights, resolveInsight, refetch: fetchData };
}
