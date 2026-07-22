import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCompanyId } from './_shared';

export function useNPSFollowups(status?: string) {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['nps', 'followups', companyId, status ?? 'all'],
    enabled: !!companyId,
    queryFn: async () => {
      let q = (supabase.from('nps_followups' as any) as any)
        .select('*, clients(name,email,phone,address_city), nps_campaigns(name)')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (status && status !== 'all') q = q.eq('status', status);
      const { data, error } = await q;
      if (error) throw error;
      return (data as any[]) ?? [];
    },
  });
}

export function useUpdateFollowup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Record<string, any>) => {
      const { error } = await (supabase.from('nps_followups' as any) as any).update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nps', 'followups'] }); toast.success('Follow-up atualizado'); },
    onError: (e: any) => toast.error(e.message),
  });
}
