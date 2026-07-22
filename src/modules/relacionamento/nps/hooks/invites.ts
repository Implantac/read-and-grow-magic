import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { QK, useCompanyId } from './_shared';

export function useNPSInvites(campaignId?: string | null) {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: [...QK.invites(companyId), campaignId],
    enabled: !!companyId,
    queryFn: async () => {
      let q = supabase.from('nps_invites').select('*, clients(name), nps_campaigns(name)').eq('company_id', companyId!).order('created_at', { ascending: false }).limit(500);
      if (campaignId) q = q.eq('campaign_id', campaignId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useGenerateInvites() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { campaign_id: string; client_ids: string[]; channel?: string; expires_in_days?: number }) => {
      const { data, error } = await supabase.functions.invoke('nps-generate-invites', { body: payload });
      if (error) throw error;
      return data;
    },
    onSuccess: (d: any) => {
      qc.invalidateQueries({ queryKey: ['nps'] });
      toast.success(`${d?.invites?.length ?? 0} convite(s) gerados`);
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useNPSTokenForInvite(inviteId?: string | null) {
  return useQuery({
    queryKey: ['nps', 'token-for-invite', inviteId],
    enabled: !!inviteId,
    queryFn: async () => {
      const { data } = await supabase.from('nps_tokens').select('token').eq('invite_id', inviteId!).maybeSingle();
      return data?.token as string | undefined;
    },
  });
}

export function publicSurveyUrl(token: string) {
  return `${window.location.origin}/nps/${token}`;
}
