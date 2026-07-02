import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CreditCheckResult {
  approved: boolean;
  credit_limit: number;
  ar_open: number;
  orders_pending: number;
  available_limit: number;
  profile_status: string;
  blocked_reason: string | null;
}

export function useCreditCheck(clientId: string | null | undefined, orderTotal: number) {
  return useQuery({
    queryKey: ['check_credit', clientId, orderTotal],
    enabled: !!clientId && orderTotal > 0,
    staleTime: 30_000,
    queryFn: async (): Promise<CreditCheckResult | null> => {
      if (!clientId) return null;
      const { data, error } = await supabase.rpc('check_credit', {
        _client_id: clientId,
        _order_total: orderTotal,
      });
      if (error) throw error;
      return data as unknown as CreditCheckResult;
    },
  });
}
