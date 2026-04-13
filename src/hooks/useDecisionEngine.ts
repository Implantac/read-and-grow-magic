import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DecisionEngineResult {
  priority_sequence: { order_number: string; reason: string; suggested_action: string }[];
  rebalancing: { from_sector: string; to_sector: string; reason: string }[];
  material_alerts: { material: string; action: string; urgency: string }[];
  summary: string;
}

export function useDecisionEngine() {
  const [decisions, setDecisions] = useState<DecisionEngineResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runDecisionEngine = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-production', {
        body: { action: 'decision_engine' },
      });
      if (error) throw error;
      if (data?.decisions) {
        setDecisions(data.decisions);
        toast.success('Motor de decisão executado com sucesso');
      }
    } catch (e: any) {
      console.error(e);
      toast.error('Erro ao executar motor de decisão: ' + (e.message || ''));
    }
    setLoading(false);
  }, []);

  return { decisions, loading, runDecisionEngine };
}
