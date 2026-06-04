import { supabase } from '@/integrations/supabase/client';
import { DRESummaryRow, DRECategoryRow } from '@/hooks/accounting/useDRE';

export const dreService = {
  async getSummary(from: string, to: string) {
    const { data, error } = await supabase.rpc('get_dre_summary' as any, {
      _from: from,
      _to: to,
    });
    if (error) throw error;
    return (data || []) as DRESummaryRow[];
  },

  async getDetailed(from: string, to: string) {
    const { data, error } = await supabase.rpc('get_dre' as any, {
      _from: from,
      _to: to,
    });
    if (error) throw error;
    return (data || []) as DRECategoryRow[];
  }
};
