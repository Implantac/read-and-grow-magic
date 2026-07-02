import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ClientTier = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface CommercialProfile {
  client_id: string;
  tier: ClientTier;
  last_purchase_at: string | null;
  ltv_12m: number;
  order_count: number;
  suggested_price_list_id: string | null;
  suggested_price_list_name: string | null;
  suggested_payment_terms: string;
}

export function useClientCommercialProfile(clientId: string | null) {
  return useQuery({
    enabled: !!clientId,
    queryKey: ['client-commercial-profile', clientId],
    staleTime: 60_000,
    queryFn: async (): Promise<CommercialProfile | null> => {
      if (!clientId) return null;
      const { data, error } = await supabase.rpc('get_client_commercial_profile', {
        _client_id: clientId,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return (row as CommercialProfile) ?? null;
    },
  });
}
