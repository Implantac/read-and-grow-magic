import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/stores/useAppStore';
import { useSupabaseQuery } from '@/hooks/shared/useSupabaseQuery';
import { useEffect } from 'react';

export const companiesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name');
    if (error) throw error;
    return data || [];
  }
};

export function useCompanies() {
  const { setCompanies, activeCompany, setActiveCompany } = useAppStore();
  const query = useSupabaseQuery(['companies'], () => companiesService.getAll());

  useEffect(() => {
    if (query.data && query.data.length > 0) {
      setCompanies(query.data as any);
      if (!activeCompany) {
        setActiveCompany(query.data[0] as any);
      }
    }
  }, [query.data, setCompanies, activeCompany, setActiveCompany]);

  return { 
    companies: (query.data || []) as any[], 
    loading: query.isLoading, 
    refetch: query.refetch 
  };
}
