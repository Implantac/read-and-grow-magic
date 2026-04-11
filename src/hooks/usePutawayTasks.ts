import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PutawayTask {
  id: string;
  taskNumber: string;
  productCode: string;
  productName: string;
  lotNumber: string | null;
  quantity: number;
  unit: string;
  sourceLocation: string | null;
  suggestedLocationCode: string | null;
  actualLocationCode: string | null;
  suggestionReason: string | null;
  priority: string;
  status: string;
  assignedTo: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export function usePutawayTasks() {
  const [tasks, setTasks] = useState<PutawayTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('putaway_tasks')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTasks((data || []).map(r => ({
        id: r.id,
        taskNumber: r.task_number,
        productCode: r.product_code,
        productName: r.product_name,
        lotNumber: r.lot_number,
        quantity: Number(r.quantity),
        unit: r.unit,
        sourceLocation: r.source_location,
        suggestedLocationCode: r.suggested_location_code,
        actualLocationCode: r.actual_location_code,
        suggestionReason: r.suggestion_reason,
        priority: r.priority,
        status: r.status,
        assignedTo: r.assigned_to,
        startedAt: r.started_at,
        completedAt: r.completed_at,
        createdAt: r.created_at,
      })));
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar tarefas');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = async (id: string, status: string, actualLocation?: string) => {
    try {
      const updates: { status: string; started_at?: string; completed_at?: string; actual_location_code?: string } = { status };
      if (status === 'in_progress') updates.started_at = new Date().toISOString();
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
        if (actualLocation) updates.actual_location_code = actualLocation;
      }
      const { error } = await supabase.from('putaway_tasks').update(updates).eq('id', id);
      if (error) throw error;
      toast.success('Tarefa atualizada');
      fetchData();
    } catch (e) {
      console.error(e);
      toast.error('Erro ao atualizar');
    }
  };

  useEffect(() => { fetchData(); }, [fetchData]);
  return { tasks, loading, refetch: fetchData, updateStatus };
}
