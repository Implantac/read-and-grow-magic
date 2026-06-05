import { supabase } from '@/integrations/supabase/client';
import { CashFlowRow } from '@/hooks/financial/useCashFlow';

export const cashFlowService = {
  async getAll() {
    const { data, error } = await supabase
      .from('cash_flow_entries')
      .select('*')
      .order('date', { ascending: true });
    if (error) throw error;
    return (data || []) as CashFlowRow[];
  }
};
