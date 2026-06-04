import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ReplenishmentTask {
  id: string;
  taskNumber: string;
  productCode: string;
  productName: string;
  sourceLocationCode: string | null;
  targetLocationCode: string | null;
  requiredQty: number;
  movedQty: number;
  unit: string;
  triggerType: string;
  priority: string;
  status: string;
  assignedTo: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export function useReplenishmentTasks() {
  const [tasks, setTasks] = useState<ReplenishmentTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('replenishment_tasks')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTasks((data || []).map(r => ({
        id: r.id,
        taskNumber: r.task_number,
        productCode: r.product_code,
        productName: r.product_name,
        sourceLocationCode: r.source_location_code,
        targetLocationCode: r.target_location_code,
        requiredQty: Number(r.required_qty),
        movedQty: Number(r.moved_qty),
        unit: r.unit,
        triggerType: r.trigger_type,
        priority: r.priority,
        status: r.status,
        assignedTo: r.assigned_to,
        startedAt: r.started_at,
        completedAt: r.completed_at,
        createdAt: r.created_at,
      })));
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar reabastecimentos');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = async (id: string, status: string, movedQty?: number) => {
    try {
      const updates: { status: string; started_at?: string; completed_at?: string; moved_qty?: number } = { status };
      if (status === 'in_progress') updates.started_at = new Date().toISOString();
      if (status === 'completed') updates.completed_at = new Date().toISOString();
      if (movedQty !== undefined) updates.moved_qty = movedQty;
      const { error } = await supabase.from('replenishment_tasks').update(updates).eq('id', id);
      if (error) throw error;
      toast.success('Reabastecimento atualizado');
      fetchData();
    } catch (e) {
      console.error(e);
      toast.error('Erro ao atualizar');
    }
  };

  useEffect(() => { fetchData(); }, [fetchData]);
  return { tasks, loading, refetch: fetchData, updateStatus };
}
