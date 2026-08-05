import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useWMSOperationalConsole() {
  const [data, setData] = useState({
    receiving: [] as any[],
    putaway: [] as any[],
    picking: [] as any[],
    packing: [] as any[],
    shipments: [] as any[],
    inventory: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  const fetchConsole = useCallback(async () => {
    setLoading(true);
    try {
      const [rec, put, pick, pack, ship, inv] = await Promise.all([
        supabase.from('wms_receiving_orders').select('*').in('status', ['pending', 'in_progress']).order('created_at', { ascending: false }),
        supabase.from('putaway_tasks').select('*').in('status', ['pending', 'in_progress']).order('priority', { ascending: false }),
        supabase.from('wms_picking_orders').select('*').in('status', ['pending', 'assigned', 'in_progress']).order('priority', { ascending: false }),
        supabase.from('wms_packing_orders').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
        supabase.from('wms_shipments').select('*').in('status', ['pending', 'loading']).order('created_at', { ascending: false }),
        supabase.from('stock_balances').select('*').lt('quantity', 10).limit(20)
      ]);

      setData({
        receiving: rec.data || [],
        putaway: put.data || [],
        picking: pick.data || [],
        packing: pack.data || [],
        shipments: ship.data || [],
        inventory: inv.data || []
      });
    } catch (error) {
      console.error('Error fetching WMS console:', error);
      toast.error('Erro ao carregar Console Operacional');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConsole();
    
    // Setup Realtime subscriptions for auto-update
    const channels = [
      supabase.channel('wms-console-updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'wms_receiving_orders' }, () => fetchConsole())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'putaway_tasks' }, () => fetchConsole())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'wms_picking_orders' }, () => fetchConsole())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'wms_packing_orders' }, () => fetchConsole())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'wms_shipments' }, () => fetchConsole())
        .subscribe()
    ];

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [fetchConsole]);

  return { ...data, loading, refetch: fetchConsole };
}
