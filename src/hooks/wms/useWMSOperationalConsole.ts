import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface WMSOperationalStats {
  receiving: Record<string, unknown>[];
  putaway: Record<string, unknown>[];
  picking: Record<string, unknown>[];
  packing: Record<string, unknown>[];
  shipments: Record<string, unknown>[];
  inventory: Record<string, unknown>[];
}

export function useWMSOperationalConsole() {
  const [data, setData] = useState<WMSOperationalStats>({
    receiving: [],
    putaway: [],
    picking: [],
    packing: [],
    shipments: [],
    inventory: []
  });
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [rec, put, pick, pack, ship, inv] = await Promise.all([
        supabase.from('wms_receiving_orders').select('*').in('status', ['pending', 'in_progress']).limit(10),
        supabase.from('putaway_tasks').select('*').eq('status', 'pending').limit(10),
        supabase.from('wms_picking_orders').select('*').in('status', ['pending', 'assigned', 'in_progress']).limit(10),
        supabase.from('wms_packing_orders').select('*').eq('status', 'pending').limit(10),
        supabase.from('wms_shipments').select('*').in('status', ['pending', 'loading']).limit(10),
        supabase.from('wms_inventory_items').select('*').gt('min_stock', 0).limit(1000)
      ]);

      if ([rec, put, pick, pack, ship, inv].some((result) => result.error)) {
        throw new Error('Uma ou mais consultas operacionais falharam');
      }

      setData({
        receiving: rec.data || [],
        putaway: put.data || [],
        picking: pick.data || [],
        packing: pack.data || [],
        shipments: ship.data || [],
        inventory: (inv.data || []).filter((item) => Number(item.available_qty) < Number(item.min_stock)).slice(0, 10)
      });
    } catch (e) {
      console.error('Erro ao carregar console operacional:', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();

    const channel = supabase.channel('wms-operational-console')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wms_movements' }, () => fetchAll())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchAll]);

  return { ...data, loading, refetch: fetchAll };
}
