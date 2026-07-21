import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProductionStep {
  id: string;
  name: string;
  code: string;
  description: string | null;
  sequence: number;
  estimated_time_minutes: number;
  sector: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ProductionOrderStep {
  id: string;
  production_order_id: string;
  step_id: string;
  sequence: number;
  responsible: string | null;
  estimated_time_minutes: number;
  realized_time_minutes: number;
  status: string;
  quantity_produced: number;
  quantity_pending: number;
  quantity_rejected: number;
  defect_reason: string | null;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  step_name?: string;
  step_code?: string;
  step_sector?: string;
}

export function useProductionSteps() {
  const [steps, setSteps] = useState<ProductionStep[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSteps = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('production_steps')
      .select('*')
      .order('sequence', { ascending: true });
    if (error) { console.error(error); toast.error('Erro ao carregar etapas'); }
    else setSteps(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchSteps(); }, [fetchSteps]);

  const createStep = async (step: Partial<ProductionStep>) => {
    const { error } = await supabase.from('production_steps').insert(step as any);
    if (error) { toast.error('Erro ao criar etapa'); return false; }
    toast.success('Etapa criada');
    await fetchSteps();
    return true;
  };

  const updateStep = async (id: string, updates: Partial<ProductionStep>) => {
    const { error } = await supabase.from('production_steps').update({ ...updates, updated_at: new Date().toISOString() } as any).eq('id', id);
    if (error) { toast.error('Erro ao atualizar etapa'); return; }
    toast.success('Etapa atualizada');
    await fetchSteps();
  };

  const deleteStep = async (id: string) => {
    const { error } = await supabase.from('production_steps').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir etapa'); return; }
    toast.success('Etapa excluída');
    await fetchSteps();
  };

  return { steps, loading, refetch: fetchSteps, createStep, updateStep, deleteStep };
}

export function useProductionOrderSteps(productionOrderId?: string) {
  const [orderSteps, setOrderSteps] = useState<ProductionOrderStep[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrderSteps = useCallback(async () => {
    if (!productionOrderId) { setOrderSteps([]); setLoading(false); return; }
    setLoading(true);
    // Sem FK entre production_order_steps.step_id e production_steps → merge manual.
    const { data, error } = await supabase
      .from('production_order_steps')
      .select('*')
      .eq('production_order_id', productionOrderId)
      .order('sequence', { ascending: true });
    if (error) { console.error(error); toast.error('Erro ao carregar etapas da OP'); setLoading(false); return; }

    const stepIds = Array.from(new Set((data || []).map((d: any) => d.step_id as string).filter(Boolean))) as string[];
    let stepsMap = new Map<string, any>();
    if (stepIds.length > 0) {
      const { data: steps } = await supabase
        .from('production_steps')
        .select('id, name, code, sector')
        .in('id', stepIds);
      (steps || []).forEach((s: any) => stepsMap.set(s.id, s));
    }
    setOrderSteps((data || []).map((d: any) => {
      const s = stepsMap.get(d.step_id);
      return { ...d, step_name: s?.name, step_code: s?.code, step_sector: s?.sector };
    }));
    setLoading(false);
  }, [productionOrderId]);

  useEffect(() => { fetchOrderSteps(); }, [fetchOrderSteps]);

  const updateOrderStep = async (id: string, updates: Partial<ProductionOrderStep>) => {
    const { error } = await supabase.from('production_order_steps').update({ ...updates, updated_at: new Date().toISOString() } as any).eq('id', id);
    if (error) { toast.error('Erro ao atualizar etapa'); return; }
    await fetchOrderSteps();
  };

  const generateStepsForOrder = async (orderId: string, quantity: number, selectedStepIds: string[]) => {
    const { data: stepsData } = await supabase
      .from('production_steps')
      .select('*')
      .in('id', selectedStepIds)
      .order('sequence');

    if (!stepsData || stepsData.length === 0) return;

    const inserts = stepsData.map((s: any) => ({
      production_order_id: orderId,
      step_id: s.id,
      sequence: s.sequence,
      estimated_time_minutes: s.estimated_time_minutes,
      quantity_pending: quantity,
      status: 'pending',
    }));

    const { error } = await supabase.from('production_order_steps').insert(inserts as any);
    if (error) { toast.error('Erro ao gerar etapas'); return; }
    toast.success(`${inserts.length} etapas geradas`);
    await fetchOrderSteps();
  };

  return { orderSteps, loading, refetch: fetchOrderSteps, updateOrderStep, generateStepsForOrder };
}
