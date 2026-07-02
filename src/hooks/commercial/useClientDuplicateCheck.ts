import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DuplicateClient {
  id: string;
  name: string;
  code: string;
  document: string;
}

export function useClientDuplicateCheck(
  document: string | null | undefined,
  excludeId?: string | null,
) {
  const clean = (document || '').replace(/\D/g, '');
  return useQuery({
    queryKey: ['client-duplicate', clean, excludeId ?? null],
    enabled: clean.length === 11 || clean.length === 14,
    staleTime: 30_000,
    queryFn: async (): Promise<DuplicateClient | null> => {
      let q = supabase
        .from('clients')
        .select('id, name, code, document')
        .eq('document', document as string)
        .limit(1);
      if (excludeId) q = q.neq('id', excludeId);
      const { data, error } = await q;
      if (error) throw error;
      return (data?.[0] as DuplicateClient) ?? null;
    },
  });
}
