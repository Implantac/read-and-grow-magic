import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProductionScheduleRow {
  id: string;
  production_order_id: string | null;
  planned_start: string;
  planned_end: string;
  actual_start: string | null;
  actual_end: string | null;
  sector: string | null;
  work_center: string | null;
  shift: string;
  priority: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useProductionSchedule() {
  const [schedules, setSchedules] = useState<ProductionScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).from('production_schedule').select('*').order('planned_start', { ascending: true });
    if (error) { console.error(error); toast.error('Erro ao carregar agendamento'); }
    else setSchedules(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const create = async (schedule: Partial<ProductionScheduleRow>) => {
    const { error } = await (supabase as any).from('production_schedule').insert(schedule);
    if (error) { toast.error('Erro ao criar agendamento'); return; }
    toast.success('Agendamento criado');
    await fetchData();
  };

  const update = async (id: string, updates: Partial<ProductionScheduleRow>) => {
    const { error } = await (supabase as any).from('production_schedule').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast.error('Erro ao atualizar agendamento'); return; }
    await fetchData();
  };

  return { schedules, loading, refetch: fetchData, create, update };
}
