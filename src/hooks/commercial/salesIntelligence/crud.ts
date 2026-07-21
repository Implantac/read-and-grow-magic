import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { handleMutationError, toastSuccess } from '@/lib/toastHelpers';
import type { Database } from '@/integrations/supabase/types';
import type { DbOpportunity, DbFollowUp, DbCampaign, DbDailyTarget } from './types';

type OpportunityInsert = Database['public']['Tables']['sales_opportunities']['Insert'];
type OpportunityUpdate = Database['public']['Tables']['sales_opportunities']['Update'];
type FollowUpInsert = Database['public']['Tables']['follow_ups']['Insert'];
type FollowUpUpdate = Database['public']['Tables']['follow_ups']['Update'];
type CampaignInsert = Database['public']['Tables']['sales_campaigns']['Insert'];
type CampaignUpdate = Database['public']['Tables']['sales_campaigns']['Update'];

// ─── Opportunities ───────────────────────────────────────────────────────
export function useOpportunities(status?: string) {
  return useQuery({
    queryKey: ['sales_opportunities', status],
    queryFn: async () => {
      let q = supabase.from('sales_opportunities').select('*').order('priority', { ascending: true }).order('created_at', { ascending: false });
      if (status) q = q.eq('status', status);
      const { data, error } = await q;
      if (error) throw error;
      return data as DbOpportunity[];
    },
  });
}

export function useCreateOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const { data, error } = await supabase.from('sales_opportunities').insert(item as OpportunityInsert).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales_opportunities'] });
      toastSuccess('Oportunidade criada');
    },
    onError: handleMutationError,
  });
}

export function useUpdateOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: any & { id: string }) => {
      const { data, error } = await supabase.from('sales_opportunities').update({ ...updates, updated_at: new Date().toISOString() } as OpportunityUpdate).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sales_opportunities'] }),
  });
}

// ─── Follow-ups ──────────────────────────────────────────────────────────
export function useFollowUps(status?: string) {
  return useQuery({
    queryKey: ['follow_ups', status],
    queryFn: async () => {
      let q = supabase.from('follow_ups').select('*').order('scheduled_date', { ascending: true });
      if (status) q = q.eq('status', status);
      const { data, error } = await q;
      if (error) throw error;
      return data as DbFollowUp[];
    },
  });
}

export function useCreateFollowUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const { data, error } = await supabase.from('follow_ups').insert(item as FollowUpInsert).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['follow_ups'] });
      toastSuccess('Follow-up agendado');
    },
    onError: handleMutationError,
  });
}

export function useUpdateFollowUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: any & { id: string }) => {
      const { data, error } = await supabase.from('follow_ups').update({ ...updates, updated_at: new Date().toISOString() } as FollowUpUpdate).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['follow_ups'] }),
  });
}

// ─── Campaigns ───────────────────────────────────────────────────────────
export function useCampaigns(status?: string) {
  return useQuery({
    queryKey: ['sales_campaigns', status],
    queryFn: async () => {
      let q = supabase.from('sales_campaigns').select('*').order('start_date', { ascending: false });
      if (status) q = q.eq('status', status);
      const { data, error } = await q;
      if (error) throw error;
      return data as DbCampaign[];
    },
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const { data, error } = await supabase.from('sales_campaigns').insert(item as CampaignInsert).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales_campaigns'] });
      toastSuccess('Campanha criada');
    },
    onError: handleMutationError,
  });
}

export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: any & { id: string }) => {
      const { data, error } = await supabase.from('sales_campaigns').update({ ...updates, updated_at: new Date().toISOString() } as CampaignUpdate).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sales_campaigns'] }),
  });
}

// ─── Daily Targets ───────────────────────────────────────────────────────
export function useDailyTargets(repId?: string) {
  return useQuery({
    queryKey: ['seller_daily_targets', repId],
    queryFn: async () => {
      let q = supabase.from('seller_daily_targets').select('*').order('target_date', { ascending: false });
      if (repId) q = q.eq('sales_rep_id', repId);
      const { data, error } = await q;
      if (error) throw error;
      return data as DbDailyTarget[];
    },
  });
}
