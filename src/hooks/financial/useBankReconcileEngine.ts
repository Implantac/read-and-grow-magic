import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type MatchSuggestion = {
  id: string;
  bank_transaction_id: string;
  cash_flow_entry_id: string;
  score: number;
  score_breakdown: Record<string, unknown>;
  status: 'pending' | 'accepted' | 'rejected' | 'auto_applied';
  created_at: string;
};

export function useBankReconcileEngine() {
  const [suggestions, setSuggestions] = useState<MatchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase.from as any)('bank_match_suggestions')
      .select('*')
      .eq('status', 'pending')
      .order('score', { ascending: false })
      .limit(200);
    if (error) toast.error('Erro ao carregar sugestões', { description: error.message });
    else setSuggestions((data as MatchSuggestion[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const runAuto = useCallback(async (bankAccountId?: string) => {
    setRunning(true);
    try {
      const { data, error } = await supabase.rpc('bank_reconcile_auto' as any, {
        p_bank_account_id: bankAccountId ?? null,
      });
      if (error) throw error;
      const r = (data as any) || {};
      toast.success('Conciliação automática executada', {
        description: `${r.scanned ?? 0} varridas • ${r.auto_reconciled ?? 0} auto-conciliadas • ${r.suggestions ?? 0} sugestões`,
      });
      await load();
      return r;
    } catch (err: any) {
      toast.error('Falha na conciliação', { description: err.message });
    } finally {
      setRunning(false);
    }
  }, [load]);

  const accept = useCallback(async (id: string) => {
    const { error } = await supabase.rpc('bank_apply_suggestion' as any, { p_suggestion_id: id });
    if (error) return toast.error('Falha ao aceitar', { description: error.message });
    toast.success('Sugestão aplicada');
    await load();
  }, [load]);

  const reject = useCallback(async (id: string) => {
    const { error } = await supabase.rpc('bank_reject_suggestion' as any, { p_suggestion_id: id });
    if (error) return toast.error('Falha ao rejeitar', { description: error.message });
    toast.success('Sugestão descartada');
    await load();
  }, [load]);

  return { suggestions, loading, running, runAuto, accept, reject, reload: load };
}
