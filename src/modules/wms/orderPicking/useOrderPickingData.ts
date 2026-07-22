import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { OrderRow } from './types';

export function useOrdersForPicking() {
  return useQuery({
    queryKey: ['orders-for-picking'],
    queryFn: async (): Promise<OrderRow[]> => {
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('id, number, client_name, status, total, date')
        .in('status', ['approved', 'awaiting_separation', 'in_separation', 'confirmed', 'awaiting_conference'])
        .order('date', { ascending: false })
        .limit(200);
      if (error) throw error;

      const ids = (ordersData || []).map((o) => o.id);
      if (ids.length === 0) return [];

      const { data: res } = await supabase
        .from('stock_reservations')
        .select('order_id, status')
        .in('order_id', ids);

      const map = new Map<string, { reserved: number; picked: number; shipped: number }>();
      (res || []).forEach((r: any) => {
        const cur = map.get(r.order_id) || { reserved: 0, picked: 0, shipped: 0 };
        if (r.status === 'reserved') cur.reserved += 1;
        if (r.status === 'picked') cur.picked += 1;
        if (r.status === 'shipped') cur.shipped += 1;
        map.set(r.order_id, cur);
      });

      return (ordersData || [])
        .map((o: any) => {
          const m = map.get(o.id) || { reserved: 0, picked: 0, shipped: 0 };
          let stage: OrderRow['stage'] = 'none';
          if (m.shipped > 0 && m.reserved === 0 && m.picked === 0) stage = 'shipped';
          else if (m.picked > 0 && m.reserved === 0) stage = 'picked';
          else if (m.picked > 0 && m.reserved > 0) stage = 'partial_picked';
          else if (m.reserved > 0) stage = 'reserved';
          return {
            ...o,
            reserved_lines: m.reserved,
            picked_lines: m.picked,
            shipped_lines: m.shipped,
            stage,
          };
        })
        .filter((o) => o.stage !== 'none');
    },
  });
}

export function useShipmentInfo(orderNumber?: string) {
  return useQuery({
    queryKey: ['order-shipment', orderNumber],
    enabled: !!orderNumber,
    queryFn: async () => {
      const { data: ship } = await supabase
        .from('wms_shipments')
        .select('id, shipment_number, status, carrier, tracking_number, shipped_at, delivered_at')
        .eq('order_number', orderNumber!)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!ship) return { shipment: null, events: [] as any[] };
      const { data: events } = await supabase
        .from('delivery_tracking')
        .select('id, event_type, description, location, registered_by, occurred_at')
        .eq('shipment_id', ship.id)
        .order('occurred_at', { ascending: false });
      return { shipment: ship as any, events: (events || []) as any[] };
    },
  });
}
