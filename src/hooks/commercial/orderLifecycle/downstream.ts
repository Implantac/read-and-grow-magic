import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import type { OrderItemLike, OrderLike } from './types';

export async function createStockReservations(order: OrderLike) {
  const items = order.items || [];
  if (items.length === 0) return;

  const reservations = items.map((item: OrderItemLike) => ({
    order_id: order.id,
    order_item_id: item.id,
    product_id: item.product_id,
    product_code: item.product_code,
    product_name: item.product_name,
    requested_qty: item.quantity,
    reserved_qty: item.quantity,
    picked_qty: 0,
    status: 'reserved',
    reserved_at: new Date().toISOString(),
    location: '',
  }));

  const { error } = await supabase.from('stock_reservations').insert(reservations);
  if (error) console.error('Error creating reservations:', error);
}

export async function createConferenceRecord(order: OrderLike) {
  const items = order.items || [];
  const confNumber = `CONF-${format(new Date(), 'yyyyMMdd')}-${order.number}`;

  const { data: existing } = await supabase
    .from('conference_records')
    .select('id')
    .eq('order_id', order.id)
    .limit(1);
  if (existing && existing.length > 0) return;

  const { data: conf, error } = await supabase.from('conference_records').insert({
    order_id: order.id,
    conference_number: confNumber,
    total_items: items.length,
    checked_items: 0,
    divergent_items: 0,
    status: 'pending',
  }).select().single();
  if (error) { console.error('Error creating conference:', error); return; }

  if (conf && items.length > 0) {
    const confItems = items.map((item: OrderItemLike) => ({
      conference_id: conf.id,
      order_item_id: item.id,
      product_code: item.product_code,
      product_name: item.product_name,
      expected_qty: item.quantity,
      checked_qty: 0,
      divergence: 0,
      status: 'pending',
    }));
    await supabase.from('conference_record_items').insert(confItems);
  }
}

export async function createBillingEntry(order: OrderLike) {
  const { data: existing } = await supabase
    .from('billing_queue')
    .select('id')
    .eq('order_id', order.id)
    .limit(1);
  if (existing && existing.length > 0) return;

  await supabase.from('billing_queue').insert({
    order_id: order.id,
    amount: order.total,
    pending_amount: order.total,
    billed_amount: 0,
    billing_type: 'full',
    status: 'awaiting_billing',
  });
}

export async function generateReceivablesFromBilling(order: OrderLike) {
  const { data: existing } = await supabase
    .from('accounts_receivable')
    .select('id')
    .eq('order_id', order.id)
    .limit(1);
  if (existing && existing.length > 0) return;

  let companyId = order.company_id ?? null;
  if (!companyId && order.client_id) {
    const { data: c } = await supabase
      .from('clients')
      .select('company_id')
      .eq('id', order.client_id)
      .maybeSingle();
    companyId = c?.company_id ?? null;
  }
  if (!companyId) {
    console.warn('[generateReceivablesFromBilling] company_id ausente; pulando geração', { orderId: order.id });
    return;
  }

  const condition = order.payment_condition || '30';
  const daysMatch = condition.match(/(\d+)/g);
  const installmentDays = daysMatch ? daysMatch.map(Number) : [30];
  const installmentCount = installmentDays.length;
  const installmentAmount = order.total / installmentCount;

  for (let i = 0; i < installmentCount; i++) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (installmentDays[i] || 30));

    await supabase.from('accounts_receivable').insert({
      company_id: companyId,
      description: `Pedido ${order.number} - Parcela ${i + 1}/${installmentCount}`,
      client_name: order.client_name ?? '',
      client_id: order.client_id ?? null,
      order_id: order.id,
      amount: installmentAmount,
      original_amount: installmentAmount,
      open_amount: installmentAmount,
      due_date: dueDate.toISOString().split('T')[0],
      issue_date: new Date().toISOString().split('T')[0],
      status: 'pending',
      category: 'Vendas',
      installment_number: i + 1,
      total_installments: installmentCount,
      notes: `Gerado automaticamente do pedido ${order.number}`,
    });
  }
}

export async function createShipmentOrder(order: OrderLike) {
  const { data: existing } = await supabase
    .from('shipment_orders')
    .select('id')
    .eq('order_id', order.id)
    .limit(1);
  if (existing && existing.length > 0) return;

  const shipNumber = `EXP-${format(new Date(), 'yyyyMMdd')}-${order.number}`;
  await supabase.from('shipment_orders').insert({
    order_id: order.id,
    shipment_number: shipNumber,
    status: 'pending',
    volumes: 1,
    total_weight: 0,
    total_value: order.total,
    expected_delivery: order.delivery_date,
  });
}

export async function releaseStockReservations(orderId: string) {
  await supabase
    .from('stock_reservations')
    .update({ status: 'released', updated_at: new Date().toISOString() })
    .eq('order_id', orderId)
    .in('status', ['reserved', 'pending']);
}
