import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useCreditProfiles() {
  return useQuery({
    queryKey: ['credit-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_credit_profiles')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreditProfileByClient(clientId: string | undefined) {
  return useQuery({
    queryKey: ['credit-profile', clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_credit_profiles')
        .select('*')
        .eq('client_id', clientId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertCreditProfile() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (profile: any) => {
      const { data, error } = await supabase
        .from('customer_credit_profiles')
        .upsert(profile, { onConflict: 'client_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['credit-profiles'] });
      qc.invalidateQueries({ queryKey: ['credit-profile'] });
      toast({ title: 'Perfil de crédito atualizado!' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });
}

export function useOrderBlocks(orderId?: string) {
  return useQuery({
    queryKey: ['order-blocks', orderId],
    queryFn: async () => {
      let query = supabase.from('order_blocks').select('*').order('created_at', { ascending: false });
      if (orderId) query = query.eq('order_id', orderId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateOrderBlock() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (block: any) => {
      const { data, error } = await supabase.from('order_blocks').insert(block).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order-blocks'] });
      toast({ title: 'Bloqueio registrado!' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });
}

export function useReleaseOrderBlock() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, released_by, release_justification }: { id: string; released_by: string; release_justification: string }) => {
      const { data, error } = await supabase
        .from('order_blocks')
        .update({ status: 'released', released_by, release_justification, released_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order-blocks'] });
      toast({ title: 'Bloqueio liberado!' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });
}

export function useCollectionActions(clientId?: string) {
  return useQuery({
    queryKey: ['collection-actions', clientId],
    queryFn: async () => {
      let query = supabase.from('collection_actions').select('*').order('created_at', { ascending: false });
      if (clientId) query = query.eq('client_id', clientId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateCollectionAction() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (action: any) => {
      const { data, error } = await supabase.from('collection_actions').insert(action).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['collection-actions'] });
      toast({ title: 'Ação de cobrança registrada!' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });
}

export function useCreditPolicies() {
  return useQuery({
    queryKey: ['credit-policies'],
    queryFn: async () => {
      const { data, error } = await supabase.from('credit_policies').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateCreditPolicy() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (policy: any) => {
      const { data, error } = await supabase.from('credit_policies').insert(policy).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['credit-policies'] });
      toast({ title: 'Política de crédito criada!' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });
}

export function useCreditAuditLogs(entityId?: string) {
  return useQuery({
    queryKey: ['credit-audit-logs', entityId],
    queryFn: async () => {
      let query = supabase.from('credit_audit_logs').select('*').order('performed_at', { ascending: false }).limit(100);
      if (entityId) query = query.eq('entity_id', entityId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}
