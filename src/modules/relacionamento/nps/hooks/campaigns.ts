import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { QK, useCompanyId } from './_shared';

export function useNPSCampaigns() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: QK.campaigns(companyId),
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.from('nps_campaigns').select('*').eq('company_id', companyId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  const companyId = useCompanyId();
  return useMutation({
    mutationFn: async (input: Partial<any> & { name: string }) => {
      let effectiveCompanyId = companyId;
      if (!effectiveCompanyId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Sessão expirada. Faça login novamente.');
        const { data: profile, error: profErr } = await supabase.from('profiles').select('company_id').eq('id', user.id).maybeSingle();
        if (profErr) throw profErr;
        effectiveCompanyId = profile?.company_id ?? undefined;
      }
      if (!effectiveCompanyId) throw new Error('Empresa ativa não encontrada. Selecione uma empresa antes de criar campanhas.');
      const { data, error } = await supabase.from('nps_campaigns').insert({ ...input, company_id: effectiveCompanyId } as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nps'] });
      toast.success('Campanha criada');
    },
    onError: (e: any) => toast.error(e.message ?? 'Erro ao criar campanha'),
  });
}

export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Record<string, any>) => {
      const { error } = await supabase.from('nps_campaigns').update(patch as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nps'] }),
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('nps_campaigns').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nps'] }); toast.success('Campanha removida'); },
    onError: (e: any) => toast.error(e.message),
  });
}
