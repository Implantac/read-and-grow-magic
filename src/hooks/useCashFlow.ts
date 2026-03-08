import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CashFlowRow {
  id: string;
  date: string;
  description: string;
  type: string;
  category: string;
  amount: number;
  balance: number;
  reference: string | null;
  account: string;
  created_at: string;
}

export function useCashFlowEntries() {
  return useQuery({
    queryKey: ['cash_flow_entries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cash_flow_entries')
        .select('*')
        .order('date', { ascending: true });
      if (error) throw error;
      return data as CashFlowRow[];
    },
  });
}
