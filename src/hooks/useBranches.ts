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
  return useQuery({
    queryKey: ['branches', companyId],
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name, tipo, canal_padrao, active')
        .eq('company_id', companyId!)
        .order('name');
      if (error) throw error;
      return (data ?? []) as unknown as Branch[];
    },
  });
}
