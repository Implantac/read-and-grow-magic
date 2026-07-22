import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { QK, useCompanyId } from './_shared';

export function useNPSAutomations() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: QK.automations(companyId),
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.from('nps_automations').select('*, nps_campaigns(name)').eq('company_id', companyId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveAutomation() {
  const qc = useQueryClient();
  const companyId = useCompanyId();
  return useMutation({
    mutationFn: async (input: any) => {
      if (input.id) {
        const { error } = await supabase.from('nps_automations').update(input as any).eq('id', input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('nps_automations').insert({ ...input, company_id: companyId! } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nps'] }); toast.success('Automação salva'); },
    onError: (e: any) => toast.error(e.message),
  });
}
