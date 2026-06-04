import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Shipment {
  id: string;
  shipmentNumber: string;
  orderNumber?: string;
  customerName: string;
  carrier?: string;
  carrierCode?: string;
  trackingNumber?: string;
  volumes: number;
  totalWeight: number;
  totalValue: number;
  shippingAddress?: string;
  status: string;
  scheduledDate?: string;
  shippedAt?: string;
  deliveredAt?: string;
  romaneioNumber?: string;
  notes?: string;
  operator?: string;
  createdAt: string;
}

export function useWMSShipments() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('wms_shipments')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) { console.error(error); toast.error('Erro ao carregar expedições'); }
    else setShipments((data || []).map((r: any) => ({
      id: r.id, shipmentNumber: r.shipment_number, orderNumber: r.order_number,
      customerName: r.customer_name, carrier: r.carrier, carrierCode: r.carrier_code,
      trackingNumber: r.tracking_number, volumes: r.volumes, totalWeight: Number(r.total_weight),
      totalValue: Number(r.total_value), shippingAddress: r.shipping_address,
      status: r.status, scheduledDate: r.scheduled_date, shippedAt: r.shipped_at,
      deliveredAt: r.delivered_at, romaneioNumber: r.romaneio_number,
      notes: r.notes, operator: r.operator, createdAt: r.created_at,
    })));
    setLoading(false);
  }, []);

  const create = async (shipment: {
    order_number?: string; customer_name: string; carrier?: string;
    volumes?: number; total_weight?: number; total_value?: number;
    shipping_address?: string; scheduled_date?: string; operator?: string;
  }) => {
    const num = 'EXP-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    const rom = 'ROM-' + num.slice(4);
    const { error } = await supabase.from('wms_shipments').insert({
      shipment_number: num, romaneio_number: rom, ...shipment,
    });
    if (error) { toast.error('Erro ao criar expedição'); return false; }
    toast.success('Expedição criada!');
    await fetch();
    return true;
  };

  const update = async (id: string, updates: any) => {
    const { error } = await supabase.from('wms_shipments').update(updates).eq('id', id);
    if (error) { toast.error('Erro ao atualizar'); return false; }
    await fetch();
    return true;
  };

  const ship = async (id: string, trackingNumber?: string) => {
    return update(id, {
      status: 'shipped', shipped_at: new Date().toISOString(),
      tracking_number: trackingNumber,
    });
  };

  const deliver = async (id: string) => {
    return update(id, { status: 'delivered', delivered_at: new Date().toISOString() });
  };

  useEffect(() => { fetch(); }, [fetch]);
  return { shipments, loading, refetch: fetch, create, update, ship, deliver };
}
