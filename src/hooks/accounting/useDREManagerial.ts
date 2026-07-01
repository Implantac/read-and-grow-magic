import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

async function getCompanyId(): Promise<string> {
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId) throw new Error('Não autenticado');
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', userId)
    .maybeSingle();
  if (!profile?.company_id) throw new Error('Empresa não encontrada');
  return profile.company_id;
}

export interface DREManagerialRow {
  cost_center_id: string | null;
  cost_center_code: string;
  cost_center_name: string;
  dre_section: string;
  category_id: string | null;
  category_name: string;
  category_type: string;
  total_amount: number;
  entry_count: number;
}

export interface DREEntry {
  id: string;
  entry_date: string;
  description: string | null;
  type: string;
  amount: number;
  category_name: string;
  cost_center_name: string;
  source: string | null;
  reference: string | null;
}

export function useDREManagerial(from: string, to: string) {
  return useQuery({
    queryKey: ['dre-managerial', from, to],
    queryFn: async (): Promise<DREManagerialRow[]> => {
      const companyId = await getCompanyId();
      const { data, error } = await supabase.rpc('dre_managerial', {
        p_company_id: companyId,
        p_from: from,
        p_to: to,
      });
      if (error) throw error;
      return (data ?? []) as DREManagerialRow[];
    },
    staleTime: 60_000,
  });
}

export function useDREManagerialEntries(
  from: string,
  to: string,
  costCenterId: string | null,
  categoryId: string | null,
  enabled = true,
) {
  return useQuery({
    queryKey: ['dre-managerial-entries', from, to, costCenterId, categoryId],
    enabled,
    queryFn: async (): Promise<DREEntry[]> => {
      const companyId = await getCompanyId();
      const { data, error } = await supabase.rpc('dre_managerial_entries', {
        p_company_id: companyId,
        p_from: from,
        p_to: to,
        p_cost_center_id: costCenterId,
        p_category_id: categoryId,
      });
      if (error) throw error;
      return (data ?? []) as DREEntry[];
    },
  });
}
