import { supabase } from '@/integrations/supabase/client';
import { DbOrder, CreateOrderInput } from '@/hooks/useOrders';
import { BaseService } from '../shared/baseService';

export class OrderService extends BaseService<DbOrder> {
  constructor() {
    super('orders');
  }

  async getAllOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as any[]).map((o) => ({
      ...o,
      items: o.order_items || [],
    })) as DbOrder[];
  }

  async createOrder(input: CreateOrderInput) {
    const { data: lastOrder } = await supabase
      .from('orders')
      .select('number')
      .order('number', { ascending: false })
      .limit(1)
      .maybeSingle();

    const lastNum = lastOrder?.number?.replace('PED', '') || '0';
    const nextNum = `PED${String(parseInt(lastNum) + 1).padStart(4, '0')}`;

    const subtotal = input.items.reduce((s, i) => s + (i.quantity * i.unit_price), 0);
    const discount = input.items.reduce((s, i) => s + i.discount, 0);
    const shipping = input.shipping || 0;
    const total = subtotal - discount + shipping;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        number: nextNum,
        client_id: input.client_id || null,
        client_name: input.client_name,
        delivery_date: input.delivery_date || null,
        payment_method: input.payment_method,
        payment_condition: input.payment_condition,
        priority: input.priority,
        subtotal,
        discount,
        shipping,
        total,
        notes: input.notes || null,
        status: 'pending',
      })
      .select()
      .single();

    if (orderError) throw orderError;

    const items = input.items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id || null,
      product_name: item.product_name,
      product_code: item.product_code,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount: item.discount,
      total: (item.quantity * item.unit_price) - item.discount,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(items);
    if (itemsError) {
      await supabase.from('orders').delete().eq('id', order.id);
      throw itemsError;
    }

    return order;
  }

  async updateStatus(id: string, status: string) {
    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  }

  async archiveForDeletion(id: string, undoDurationSeconds: number) {
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .single();
    
    if (fetchError || !order) throw new Error('Pedido não encontrado');

    const expiresAt = new Date(Date.now() + undoDurationSeconds * 1000).toISOString();

    const { data: archiveData, error: archiveError } = await supabase
      .from('deleted_orders_archive')
      .insert({
        original_order_id: id,
        order_data: order,
        expires_at: expiresAt
      })
      .select()
      .single();

    if (archiveError) throw archiveError;

    const { error: deleteError } = await supabase.from('orders').delete().eq('id', id);
    if (deleteError) {
      await supabase.from('deleted_orders_archive').delete().eq('id', archiveData.id);
      throw deleteError;
    }

    return { order, archiveId: archiveData.id };
  }

  async restoreOrder(archiveId: string, deletedOrder: any) {
    const { data: archive, error: checkError } = await supabase
      .from('deleted_orders_archive')
      .select('*')
      .eq('id', archiveId)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (checkError || !archive) {
      throw new Error('Tempo para desfazer expirou ou registro não encontrado no servidor.');
    }

    const { order_items, ...orderData } = deletedOrder;
    
    const { data: restored, error: restError } = await supabase.from('orders').insert(orderData).select().single();
    if (restError) throw restError;

    if (order_items && order_items.length > 0) {
      const restoredItems = order_items.map((item: any) => ({
        ...item,
        order_id: restored.id
      }));
      const { error: itemsError } = await supabase.from('order_items').insert(restoredItems);
      if (itemsError) throw itemsError;
    }

    await supabase.from('deleted_orders_archive').delete().eq('id', archiveId);
  }
}

export const orderService = new OrderService();
