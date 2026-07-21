import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProductionMachine {
  id: string;
  code: string;
  name: string;
  type: string;
  sector: string | null;
  status: string;
  capacity_per_hour: number;
  current_operator: string | null;
  current_order_id: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export function useProductionMachines() {
  const [machines, setMachines] = useState<ProductionMachine[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMachines = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('production_machines').select('*').order('code');
    if (error) console.error(error);
    else setMachines(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchMachines(); }, [fetchMachines]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('production-machines-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'production_machines' }, () => { fetchMachines(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchMachines]);

  const create = async (machine: Partial<ProductionMachine>) => {
    const { error } = await supabase.from('production_machines').insert(machine);
    if (error) { toast.error('Erro ao criar máquina'); return false; }
    toast.success('Máquina cadastrada');
    await fetchMachines();
    return true;
  };

  const update = async (id: string, updates: Partial<ProductionMachine>) => {
    const { error } = await supabase.from('production_machines').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast.error('Erro ao atualizar máquina'); return; }
    await fetchMachines();
  };

  const activeMachines = machines.filter(m => m.active);
  const runningMachines = machines.filter(m => m.status === 'running');
  const stoppedMachines = machines.filter(m => m.status === 'stopped' || m.status === 'maintenance');

  return { machines, activeMachines, runningMachines, stoppedMachines, loading, refetch: fetchMachines, create, update };
}
