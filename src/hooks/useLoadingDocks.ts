import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LoadingDock {
  id: string;
  dockCode: string;
  dockName: string | null;
  dockType: string;
  status: string;
  carrier: string | null;
  vehiclePlate: string | null;
  driverName: string | null;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  notes: string | null;
  createdAt: string;
}

export function useLoadingDocks() {
  const [docks, setDocks] = useState<LoadingDock[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('loading_docks')
        .select('*')
        .order('dock_code');
      if (error) throw error;
      setDocks((data || []).map(r => ({
        id: r.id,
        dockCode: r.dock_code,
        dockName: r.dock_name,
        dockType: r.dock_type,
        status: r.status,
        carrier: r.carrier,
        vehiclePlate: r.vehicle_plate,
        driverName: r.driver_name,
        scheduledStart: r.scheduled_start,
        scheduledEnd: r.scheduled_end,
        actualStart: r.actual_start,
        actualEnd: r.actual_end,
        notes: r.notes,
        createdAt: r.created_at,
      })));
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar docas');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = async (id: string, status: string, extra?: Record<string, unknown>) => {
    try {
      const { error } = await supabase.from('loading_docks').update({ status, ...extra }).eq('id', id);
      if (error) throw error;
      toast.success('Doca atualizada');
      fetchData();
    } catch (e) {
      console.error(e);
      toast.error('Erro ao atualizar');
    }
  };

  useEffect(() => { fetchData(); }, [fetchData]);
  return { docks, loading, refetch: fetchData, updateStatus };
}
