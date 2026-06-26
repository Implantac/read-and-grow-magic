import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEnterpriseStore } from '@/core/stores/useEnterpriseStore';

export interface CrossModuleEvent {
  id: string;
  event_type: string;
  source_module: string;
  source_table: string;
  source_id: string | null;
  source_reference: string | null;
  affected_modules: string[];
  affected_tables: string[];
  affected_records: Array<{ table: string; count?: number; action: string }>;
  status: string;
  description: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export function useCrossModuleEvents(limit = 200) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['cross_module_events', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cross_module_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as unknown as CrossModuleEvent[];
    },
    staleTime: 10_000,
  });

  const companyId = useEnterpriseStore((s) => s.activeCompanyId);
  useEffect(() => {
    if (!companyId) return;
    const channel = supabase
      .channel(`cross_module_events_rt:${companyId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'cross_module_events', filter: `company_id=eq.${companyId}` },
        () => qc.invalidateQueries({ queryKey: ['cross_module_events'] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc, companyId]);

  return query;
}
