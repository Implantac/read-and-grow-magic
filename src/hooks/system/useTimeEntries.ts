import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEnterpriseStore } from '@/core/stores/useEnterpriseStore';

export interface TimeEntryRow {
  id: string;
  production_order_id: string | null;
  order_number: string;
  operation_id: string | null;
  operation_name: string;
  operator: string;
  start_time: string;
  end_time: string | null;
  paused_time: number;
  produced_quantity: number;
  rejected_quantity: number;
  status: string;
  notes: string | null;
  work_center: string | null;
  created_at: string;
}

export function useTimeEntries() {
  const [entries, setEntries] = useState<TimeEntryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('time_entries').select('*').order('start_time', { ascending: false });
    if (error) { console.error(error); toast.error('Erro ao carregar apontamentos'); }
    else setEntries(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const update = async (id: string, updates: Partial<TimeEntryRow>) => {
    const { error } = await supabase.from('time_entries').update(updates).eq('id', id);
    if (error) { toast.error('Erro ao atualizar apontamento'); return; }
    await fetch();
  };

  const create = async (entry: Omit<TimeEntryRow, 'id' | 'created_at'>) => {
    const company_id = useEnterpriseStore.getState().activeCompanyId;
    if (!company_id) { toast.error('Empresa não selecionada'); return; }
    const { error } = await supabase.from('time_entries').insert({ ...entry, company_id });
    if (error) { toast.error('Erro ao criar apontamento'); return; }
    toast.success('Apontamento criado');
    await fetch();
  };

  return { entries, loading, refetch: fetch, update, create };
}
