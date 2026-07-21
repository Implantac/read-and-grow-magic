import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PickingWave {
  id: string;
  waveNumber: string;
  name: string | null;
  status: string;
  strategy: string;
  carrier: string | null;
  route: string | null;
  shippingWindowStart: string | null;
  shippingWindowEnd: string | null;
  ordersCount: number;
  itemsCount: number;
  pickedItems: number;
  priority: string;
  assignedTo: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export function usePickingWaves() {
  const [waves, setWaves] = useState<PickingWave[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('picking_waves')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setWaves((data || []).map(r => ({
        id: r.id,
        waveNumber: r.wave_number,
        name: r.name,
        status: r.status,
        strategy: r.strategy,
        carrier: r.carrier,
        route: r.route,
        shippingWindowStart: r.shipping_window_start,
        shippingWindowEnd: r.shipping_window_end,
        ordersCount: r.orders_count ?? 0,
        itemsCount: r.items_count ?? 0,
        pickedItems: r.picked_items ?? 0,
        priority: r.priority,
        assignedTo: r.assigned_to,
        startedAt: r.started_at,
        completedAt: r.completed_at,
        createdAt: r.created_at,
      })));
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar ondas');
    } finally {
      setLoading(false);
    }
  }, []);

  const createWave = async (wave: Partial<PickingWave>) => {
    try {
      const { error } = await supabase.from('picking_waves').insert({
        wave_number: wave.waveNumber || `WAVE-${Date.now()}`,
        name: wave.name,
        strategy: wave.strategy || 'wave',
        carrier: wave.carrier,
        route: wave.route,
        priority: wave.priority || 'medium',
        shipping_window_start: wave.shippingWindowStart,
        shipping_window_end: wave.shippingWindowEnd,
      });
      if (error) throw error;
      toast.success('Onda criada');
      fetchData();
    } catch (e) {
      console.error(e);
      toast.error('Erro ao criar onda');
    }
  };

  const updateWaveStatus = async (id: string, status: string) => {
    try {
      const updates: { status: string; started_at?: string; completed_at?: string } = { status };
      if (status === 'in_progress') updates.started_at = new Date().toISOString();
      if (status === 'completed') updates.completed_at = new Date().toISOString();
      const { error } = await supabase.from('picking_waves').update(updates as any).eq('id', id);
      if (error) throw error;
      toast.success('Status atualizado');
      fetchData();
    } catch (e) {
      console.error(e);
      toast.error('Erro ao atualizar');
    }
  };

  useEffect(() => { fetchData(); }, [fetchData]);
  return { waves, loading, refetch: fetchData, createWave, updateWaveStatus };
}
