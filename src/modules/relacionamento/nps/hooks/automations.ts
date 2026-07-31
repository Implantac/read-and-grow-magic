import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { QK, useCompanyId } from './_shared';

export type NPSAutomationInput = Partial<TablesInsert<'nps_automations'>> & { id?: string };

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
    mutationFn: async (input: NPSAutomationInput) => {
      if (input.id) {
        const { id, ...patch } = input;
        const { error } = await supabase.from('nps_automations').update(patch as TablesUpdate<'nps_automations'>).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('nps_automations').insert({ ...input, company_id: companyId! } as TablesInsert<'nps_automations'>);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nps'] }); toast.success('Automação salva'); },
    onError: (e: Error) => toast.error(e.message),
  });
}
