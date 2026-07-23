import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toastError, toastSuccess } from '@/lib/toastHelpers';
import type { Appt, Dock } from './types';

export function useDockScheduling(day: string) {
  const [loading, setLoading] = useState(true);
  const [appts, setAppts] = useState<Appt[]>([]);
  const [docks, setDocks] = useState<Dock[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const start = new Date(`${day}T00:00:00`).toISOString();
    const end = new Date(`${day}T23:59:59`).toISOString();
    const [a, d] = await Promise.all([
      supabase
        .from('yard_appointments')
        .select('*')
        .gte('scheduled_start', start)
        .lte('scheduled_start', end)
        .order('scheduled_start'),
      supabase.from('wms_docks').select('id,name,type,status').order('name'),
    ]);
    if (a.error) toastError('Erro ao carregar agendamentos', a.error.message);
    if (d.error) toastError('Erro ao carregar docas', d.error.message);
    setAppts((a.data as Appt[]) || []);
    setDocks((d.data as Dock[]) || []);
    setLoading(false);
  }, [day]);

  useEffect(() => { load(); }, [load]);

  const kpis = useMemo(() => ({
    total: appts.length,
    inProg: appts.filter((x) => x.status === 'in_progress').length,
    done: appts.filter((x) => x.status === 'completed').length,
    issues: appts.filter((x) => x.status === 'no_show' || x.status === 'cancelled').length,
  }), [appts]);

  const byDock = useMemo(() => {
    const map = new Map<string, Appt[]>();
    docks.forEach((d) => map.set(d.id, []));
    appts.forEach((a) => {
      if (!a.dock_id) return;
      if (!map.has(a.dock_id)) map.set(a.dock_id, []);
      map.get(a.dock_id)!.push(a);
    });
    return map;
  }, [appts, docks]);

  async function changeStatus(id: string, status: string) {
    const { error } = await supabase.from('yard_appointments').update({ status }).eq('id', id);
    if (error) { toastError('Erro ao atualizar', error.message); return; }
    toastSuccess('Status atualizado');
    load();
  }

  return { loading, appts, docks, kpis, byDock, load, changeStatus };
}
