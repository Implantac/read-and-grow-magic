import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesUpdate } from '@/integrations/supabase/types';

export interface PurchaseOrderItemView {
  id: string;
  productId: string | null;
  productName: string | null;
  productCode: string | null;
  quantity: number;
  receivedQuantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  unit: string | null;
}

export interface PurchaseOrderView {
  id: string;
  number: string | null;
  supplierId: string | null;
  supplierName: string | null;
  date: string | null;
  expectedDelivery: string | null;
  items: PurchaseOrderItemView[];
  subtotal: number;
  discount: number;
  shipping: number;
  taxes: number;
  total: number;
  paymentTerms: string;
  paymentCondition: string;
  status: string | null;
  priority: string | null;
  buyerId: string;
  buyerName: string;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export function usePurchaseOrders() {
  const [orders, setOrders] = useState<PurchaseOrderView[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data: ordersData, error: ordersError } = await supabase.from('purchase_orders').select('*').order('created_at', { ascending: false });
    if (ordersError) { console.error(ordersError); toast.error('Erro ao carregar pedidos'); setLoading(false); return; }

    const { data: itemsData } = await supabase.from('purchase_order_items').select('*');
    const itemsMap = new Map<string, PurchaseOrderItemView[]>();
    (itemsData || []).forEach((item: Tables<'purchase_order_items'>) => {
      const arr = itemsMap.get(item.purchase_order_id) || [];
      arr.push({
        id: item.id,
        productId: item.product_id,
        productName: item.product_name,
        productCode: item.product_code,
        quantity: Number(item.quantity),
        receivedQuantity: Number(item.received_quantity),
        unitPrice: Number(item.unit_price),
        discount: Number(item.discount),
        total: Number(item.total),
        unit: item.unit,
      });
      itemsMap.set(item.purchase_order_id, arr);
    });

    const mapped = (ordersData || []).map((o: Tables<'purchase_orders'>) => ({
      id: o.id,
      number: o.number,
      supplierId: o.supplier_id,
      supplierName: o.supplier_name,
      date: o.date,
      expectedDelivery: o.expected_delivery || o.date,
      items: itemsMap.get(o.id) || [],
      subtotal: Number(o.subtotal),
      discount: Number(o.discount),
      shipping: Number(o.shipping),
      taxes: Number(o.taxes),
      total: Number(o.total),
      paymentTerms: o.payment_terms || '',
      paymentCondition: o.payment_condition || '',
      status: o.status,
      priority: o.priority,
      buyerId: o.buyer_id || '',
      buyerName: o.buyer_name || '',
      notes: o.notes,
      createdAt: o.created_at,
      updatedAt: o.updated_at,
    }));

    setOrders(mapped);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const update = async (id: string, updates: TablesUpdate<'purchase_orders'>) => {
    const { error } = await supabase.from('purchase_orders').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast.error('Erro ao atualizar pedido'); return; }
    await fetch();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('purchase_orders').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir pedido'); return; }
    toast.success('Pedido excluído');
    await fetch();
  };

  return { orders, loading, refetch: fetch, update, remove };
}
