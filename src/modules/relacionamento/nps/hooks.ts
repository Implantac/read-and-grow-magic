import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { toast } from 'sonner';
import type { NPSStats } from './types';

const QK = {
  stats: (cid?: string) => ['nps', 'stats', cid],
  campaigns: (cid?: string) => ['nps', 'campaigns', cid],
  answers: (cid?: string, campaignId?: string | null) => ['nps', 'answers', cid, campaignId],
  invites: (cid?: string) => ['nps', 'invites', cid],
  templates: (cid?: string) => ['nps', 'templates', cid],
  automations: (cid?: string) => ['nps', 'automations', cid],
  webhooks: (cid?: string) => ['nps', 'webhooks', cid],
  questions: (cid?: string, cpn?: string) => ['nps', 'questions', cid, cpn],
  clientHistory: (cid?: string, cliId?: string) => ['nps', 'client-history', cid, cliId],
};

function useCompanyId() {
  const { currentCompany } = useEnterprise() as any;
  return currentCompany?.id as string | undefined;
}

export function useNPSStats() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: QK.stats(companyId),
    enabled: !!companyId,
    queryFn: async (): Promise<NPSStats> => {
      const [{ data: answers }, { count: activeCount }, { count: invitesCount }] = await Promise.all([
        supabase.from('nps_answers').select('score,category').eq('company_id', companyId!),
        supabase.from('nps_campaigns').select('*', { count: 'exact', head: true }).eq('company_id', companyId!).eq('status', 'active'),
        supabase.from('nps_invites').select('*', { count: 'exact', head: true }).eq('company_id', companyId!),
      ]);
      const rows = answers ?? [];
      const total = rows.length;
      const promoters = rows.filter((r) => r.category === 'promoter').length;
      const passives = rows.filter((r) => r.category === 'passive').length;
      const detractors = rows.filter((r) => r.category === 'detractor').length;
      const score = total > 0 ? Math.round(((promoters - detractors) / total) * 100) : 0;
      const responseRate = (invitesCount ?? 0) > 0 ? Math.round((total / (invitesCount ?? 1)) * 100) : 0;
      return {
        score, promoters, passives, detractors, total, responseRate,
        activeCampaigns: activeCount ?? 0,
      };
    },
  });
}

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
      const { data, error } = await supabase.from('nps_campaigns').insert({ ...input, company_id: companyId! } as any).select().single();
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

export function useNPSAnswers(campaignId?: string | null, limit = 500) {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: QK.answers(companyId, campaignId),
    enabled: !!companyId,
    queryFn: async () => {
      let q = supabase.from('nps_answers').select('*, clients(name,city,segment)').eq('company_id', companyId!).order('responded_at', { ascending: false }).limit(limit);
      if (campaignId) q = q.eq('campaign_id', campaignId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

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

export function useNPSTemplates() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: QK.templates(companyId),
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.from('nps_templates').select('*').eq('company_id', companyId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveTemplate() {
  const qc = useQueryClient();
  const companyId = useCompanyId();
  return useMutation({
    mutationFn: async (input: any) => {
      if (input.id) {
        const { error } = await supabase.from('nps_templates').update(input as any).eq('id', input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('nps_templates').insert({ ...input, company_id: companyId! } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nps'] }); toast.success('Template salvo'); },
    onError: (e: any) => toast.error(e.message),
  });
}

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

export function useNPSWebhooks() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: QK.webhooks(companyId),
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.from('nps_webhooks').select('*').eq('company_id', companyId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveWebhook() {
  const qc = useQueryClient();
  const companyId = useCompanyId();
  return useMutation({
    mutationFn: async (input: any) => {
      if (input.id) {
        const { error } = await supabase.from('nps_webhooks').update(input as any).eq('id', input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('nps_webhooks').insert({ ...input, company_id: companyId! } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nps'] }); toast.success('Webhook salvo'); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useNPSQuestions(campaignId?: string | null) {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: QK.questions(companyId, campaignId ?? undefined),
    enabled: !!companyId && !!campaignId,
    queryFn: async () => {
      const { data, error } = await supabase.from('nps_questions').select('*').eq('company_id', companyId!).eq('campaign_id', campaignId!).order('order_index');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useClientNPSHistory(clientId?: string | null) {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: QK.clientHistory(companyId, clientId ?? undefined),
    enabled: !!companyId && !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase.from('nps_answers').select('*, nps_campaigns(name)').eq('company_id', companyId!).eq('client_id', clientId!).order('responded_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useClientNPSSummary(clientId?: string | null) {
  const { data: history } = useClientNPSHistory(clientId);
  const rows = history ?? [];
  const total = rows.length;
  const last = rows[0];
  const avg = total ? rows.reduce((s, r) => s + (r.score ?? 0), 0) / total : 0;
  const promoters = rows.filter((r) => r.category === 'promoter').length;
  const detractors = rows.filter((r) => r.category === 'detractor').length;
  const score = total ? Math.round(((promoters - detractors) / total) * 100) : 0;
  return { rows, total, last, avg, score };
}

export function publicSurveyUrl(token: string) {
  return `${window.location.origin}/nps/${token}`;
}
