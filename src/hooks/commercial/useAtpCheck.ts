import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type AtpStatus = 'green' | 'amber' | 'red';

export interface AtpCheckResult {
  status: AtpStatus;
  on_hand: number;
  reserved: number;
  available: number;
  incoming: number;
  next_incoming_date: string | null;
  requested: number;
  blocked_reason?: string | null;
}

export function useAtpCheck(
  productId: string | null | undefined,
  qty: number,
  dueDate?: string | null,
) {
  return useQuery({
    queryKey: ['check_atp', productId, qty, dueDate],
    enabled: !!productId && qty > 0,
    staleTime: 15_000,
    queryFn: async (): Promise<AtpCheckResult | null> => {
      if (!productId) return null;
      const { data, error } = await supabase.rpc('check_atp', {
        _product_id: productId,
        _qty: qty,
        _due_date: dueDate ?? null,
      });
      if (error) throw error;
      return data as unknown as AtpCheckResult;
    },
  });
}
