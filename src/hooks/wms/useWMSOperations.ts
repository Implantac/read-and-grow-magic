import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useWMSMovements() {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('wms_movements').select('*').order('created_at', { ascending: false });
    if (error) { console.error(error); toast.error('Erro ao carregar movimentações'); }
    else setMovements((data || []).map((r: any) => ({
      id: r.id, productId: r.product_id, productCode: r.product_code, productName: r.product_name,
      type: r.type, fromLocation: r.from_location || '', toLocation: r.to_location || '',
      quantity: Number(r.quantity), reason: r.reason, operator: r.operator || '',
      reference: r.reference, createdAt: r.created_at,
    })));
    setLoading(false);
  }, []);

  const createMovement = async (movement: {
    product_id?: string; product_code: string; product_name: string;
    type: string; from_location?: string; to_location?: string;
    quantity: number; reason: string; reference?: string; operator?: string;
  }) => {
    const { error } = await supabase.from('wms_movements').insert(movement);
    if (error) { toast.error('Erro ao criar movimentação'); console.error(error); return false; }
    toast.success('Movimentação registrada! Estoque ERP atualizado automaticamente.');
    await fetchMovements();
    return true;
  };

  useEffect(() => { fetchMovements(); }, [fetchMovements]);
  return { movements, loading, refetch: fetchMovements, createMovement };
}

export function useStockMovements() {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('stock_movements').select('*').order('created_at', { ascending: false });
    if (error) { console.error(error); toast.error('Erro ao carregar movimentações de estoque'); }
    else setMovements((data || []).map((r: any) => ({
      id: r.id, documentNumber: r.document_number, productId: r.product_id,
      productCode: r.product_code, productName: r.product_name,
      type: r.type, direction: r.direction, quantity: Number(r.quantity),
      unitCost: Number(r.unit_cost), totalCost: Number(r.total_cost),
      batch: r.batch, fromWarehouse: r.from_warehouse, toWarehouse: r.to_warehouse,
      reference: r.reference, notes: r.notes, operator: r.operator,
      source: r.source, wmsMovementId: r.wms_movement_id, createdAt: r.created_at,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchMovements(); }, [fetchMovements]);
  return { movements, loading, refetch: fetchMovements };
}

export function useWMSReceiving() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('wms_receiving_orders' as any).select('*').order('created_at', { ascending: false });
    if (error) { console.error(error); toast.error('Erro ao carregar recebimentos'); }
    else setOrders((data || []).map((r: any) => ({
      id: r.id, orderNumber: r.order_number, supplier: r.supplier,
      expectedDate: r.expected_date, receivedDate: r.received_date, dock: r.dock || '',
      itemsCount: r.items_count, receivedItems: r.received_items,
      status: r.status, operator: r.operator, notes: r.notes, createdAt: r.created_at,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const update = async (id: string, updates: any) => {
    const { error } = await supabase.from('wms_receiving_orders' as any).update(updates).eq('id', id);
    if (error) { toast.error('Erro ao atualizar'); return; }
    await fetch();
  };

  return { orders, loading, refetch: fetch, update };
}

export function useWMSPicking() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('wms_picking_orders' as any).select('*').order('created_at', { ascending: false });
    if (error) { console.error(error); toast.error('Erro ao carregar pickings'); }
    else setOrders((data || []).map((r: any) => ({
      id: r.id, orderNumber: r.order_number, salesOrderId: r.sales_order_id,
      customerName: r.customer_name, priority: r.priority,
      itemsCount: r.items_count || 0, pickedItems: r.picked_items || 0,
      status: r.status, assignedTo: r.assigned_to || '', startedAt: r.started_at,
      completedAt: r.completed_at, createdAt: r.created_at,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const update = async (id: string, updates: any) => {
    const { error } = await supabase.from('wms_picking_orders' as any).update(updates).eq('id', id);
    if (error) { toast.error('Erro ao atualizar picking'); return false; }
    toast.success('Picking atualizado!');
    await fetch();
    return true;
  };

  const startPicking = async (id: string, operator: string) => {
    return update(id, { status: 'in_progress', assigned_to: operator, started_at: new Date().toISOString() });
  };

  const completePicking = async (id: string) => {
    return update(id, { status: 'completed', completed_at: new Date().toISOString() });
  };

  return { orders, loading, refetch: fetch, update, startPicking, completePicking };
}

export function useWMSPacking() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('wms_packing_orders' as any).select('*').order('created_at', { ascending: false });
    if (error) { console.error(error); toast.error('Erro ao carregar packings'); }
    else setOrders((data || []).map((r: any) => ({
      id: r.id, orderNumber: r.order_number, customerName: r.customer_name,
      volumes: r.volumes, status: r.status, operator: r.operator || '',
      startedAt: r.started_at, completedAt: r.completed_at,
      shippedAt: r.shipped_at, trackingCode: r.tracking_code, createdAt: r.created_at,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const update = async (id: string, updates: any) => {
    const { error } = await supabase.from('wms_packing_orders' as any).update(updates).eq('id', id);
    if (error) { toast.error('Erro ao atualizar'); return; }
    await fetch();
  };

  return { orders, loading, refetch: fetch, update };
}

export function useWMSStorageLocations() {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('wms_storage_locations' as any).select('*').order('code');
    if (error) { console.error(error); toast.error('Erro ao carregar endereços'); }
    else setLocations((data || []).map((r: any) => ({
      id: r.id, code: r.code, zone: r.zone, type: r.type,
      capacity: r.capacity, occupied: r.occupied, active: r.active,
      products: [], // simplified
    })));
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { locations, loading, refetch: fetch };
}

export function useWMSDashboardStats() {
  const [stats, setStats] = useState({ receiving: 0, picking: 0, packing: 0, shipped: 0, occupancy: 0, totalLocations: 0, occupied: 0, capacity: 0 });
  const [recentMovements, setRecentMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const [recRes, pickRes, packRes, storRes, movRes] = await Promise.all([
      supabase.from('wms_receiving_orders' as any).select('status'),
      supabase.from('wms_picking_orders' as any).select('status'),
      supabase.from('wms_packing_orders' as any).select('status'),
      supabase.from('wms_storage_locations' as any).select('capacity,occupied'),
      supabase.from('wms_movements' as any).select('*').order('created_at', { ascending: false }).limit(5),
    ]);

    const receiving = (recRes.data || []).filter((r: any) => ['pending', 'in_progress'].includes(r.status)).length;
    const picking = (pickRes.data || []).filter((r: any) => ['pending', 'assigned', 'in_progress'].includes(r.status)).length;
    const packing = (packRes.data || []).filter((r: any) => r.status === 'pending').length;
    const shipped = (packRes.data || []).filter((r: any) => r.status === 'shipped').length;

    const totalCap = (storRes.data || []).reduce((s: number, l: any) => s + l.capacity, 0);
    const totalOcc = (storRes.data || []).reduce((s: number, l: any) => s + l.occupied, 0);

    setStats({
      receiving, picking, packing, shipped,
      occupancy: totalCap > 0 ? Math.round((totalOcc / totalCap) * 100) : 0,
      totalLocations: (storRes.data || []).length,
      occupied: totalOcc,
      capacity: totalCap,
    });

    setRecentMovements((movRes.data || []).map((r: any) => ({
      id: r.id, productName: r.product_name, type: r.type,
      quantity: Number(r.quantity), createdAt: r.created_at,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { stats, recentMovements, loading };
}
