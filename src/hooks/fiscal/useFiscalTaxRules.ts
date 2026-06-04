import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useFiscalTaxRules(origin?: string, destination?: string) {
  return useQuery({
    queryKey: ['fiscal_tax_rules', origin, destination],
    queryFn: async () => {
      let query = supabase.from('fiscal_tax_rules').select('*');
      
      if (origin) query = query.eq('origin_state', origin);
      if (destination) query = query.eq('destination_state', destination);
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });
}
