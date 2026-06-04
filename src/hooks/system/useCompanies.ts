import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';


export function useCompanies() {
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

  return { 
    companies: query.data || [], 
    loading: query.isLoading, 
    refetch: query.refetch 
  };
}

