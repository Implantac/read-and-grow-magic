import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/stores/useAppStore';
import { useEffect } from 'react';



export function useCompanies() {
  const { setCompanies, activeCompany, setActiveCompany } = useAppStore();
  const query = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    if (query.data && query.data.length > 0) {
      setCompanies(query.data as any);
      if (!activeCompany) {
        setActiveCompany(query.data[0] as any);
      }
    }
  }, [query.data, setCompanies, activeCompany, setActiveCompany]);

  return { 
    companies: query.data || [], 
    loading: query.isLoading, 
    refetch: query.refetch 
  };
}

