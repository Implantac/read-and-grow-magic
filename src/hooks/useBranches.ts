import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEnterpriseStore } from '@/core/stores/useEnterpriseStore';

export interface Branch {
  id: string;
  name: string;
  tipo: 'industria' | 'filial' | 'cd';
  canal_padrao: 'VAREJO_PDV' | 'ATACADO_INDUSTRIA';
  active?: boolean;
}

export function useBranches() {
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);
  const filterKey = companyId || 'no-tenant';
  return useQuery({
    queryKey: ['branches', filterKey],
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name, tipo, canal_padrao, is_active')
        .eq('company_id', companyId!)
        .order('name');
      if (error) throw error;
      return (data ?? []) as unknown as Branch[];
    },
  });
}
