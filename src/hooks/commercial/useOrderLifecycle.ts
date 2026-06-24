/**
 * Order Lifecycle Orchestrator
 * Centralizes all cross-module integration logic for the order flow.
 * When a status transition happens, this hook triggers downstream actions:
 * - confirmed → auto-create stock reservations for items
 * - in_separation → track separation progress
 * - awaiting_conference → auto-create conference record
 * - awaiting_billing → auto-create billing queue entry
 * - invoiced → generate accounts receivable + update order
 * - shipped → create shipment order
 * - Production completion → advance order if all OPs done
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { validateTransition } from '@/lib/orderFlowEngine';
import { format } from 'date-fns';
import { toastSuccess, toastError } from '@/lib/toastHelpers';

export interface OrderItemLike {
  id: string;
  product_id?: string | null;
  product_code?: string | null;
  product_name?: string | null;
  quantity: number;
}

export interface OrderLike {
  id: string;
  number: string | number;
  status: string;
  total: number;
  client_id?: string | null;
  client_name?: string | null;
  payment_condition?: string | null;
  delivery_date?: string | null;
  financial_approval?: string | null;
  commercial_approval?: string | null;
  items?: OrderItemLike[];
}

interface TransitionInput {
  orderId: string;
  order: OrderLike;
  targetStatus: string;
  observation?: string;
  blockReason?: string;
  changedBy?: string;
}

async function createStockReservations(order: OrderLike) {
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

  const { error } = await supabase.from('stock_reservations').insert(reservations as any);
  if (error) console.error('Error creating reservations:', error);
}

async function createConferenceRecord(order: OrderLike) {
  const items = order.items || [];
  const confNumber = `CONF-${format(new Date(), 'yyyyMMdd')}-${order.number}`;

  // Check if conference already exists
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
  } as any).select().single();
  if (error) { console.error('Error creating conference:', error); return; }

  // Create conference items
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
    await supabase.from('conference_record_items').insert(confItems as any);
  }
}

async function createBillingEntry(order: OrderLike) {
  // Check if billing entry already exists
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
  } as any);
}

async function generateReceivablesFromBilling(order: OrderLike) {
  // Check if receivable already exists
  const { data: existing } = await supabase
    .from('accounts_receivable')
    .select('id')
    .eq('order_id', order.id)
    .limit(1);
  if (existing && existing.length > 0) return;

  // Parse payment condition to determine installments
  const condition = order.payment_condition || '30';
  const daysMatch = condition.match(/(\d+)/g);
  const installmentDays = daysMatch ? daysMatch.map(Number) : [30];
  const installmentCount = installmentDays.length;
  const installmentAmount = order.total / installmentCount;

  for (let i = 0; i < installmentCount; i++) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (installmentDays[i] || 30));

    await supabase.from('accounts_receivable').insert({
      description: `Pedido ${order.number} - Parcela ${i + 1}/${installmentCount}`,
      client_name: order.client_name,
      client_id: order.client_id,
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

async function createShipmentOrder(order: OrderLike) {
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
  } as any);
}

async function releaseStockReservations(orderId: string) {
  await supabase
    .from('stock_reservations')
    .update({ status: 'released', updated_at: new Date().toISOString() } as any)
    .eq('order_id', orderId)
    .in('status', ['reserved', 'pending']);
}

export function useOrderLifecycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TransitionInput) => {
      const { orderId, order, targetStatus, observation, blockReason, changedBy } = input;
      const currentStatus = order.status;

      // Validate transition
      const validation = validateTransition(currentStatus, targetStatus, {
        hasFinancialApproval: order.financial_approval === 'approved',
        hasCommercialApproval: order.commercial_approval === 'approved',
        isBlocked: currentStatus === 'blocked',
        isSeparated: ['awaiting_conference', 'conferenced', 'awaiting_billing', 'invoiced', 'shipped', 'delivered'].includes(currentStatus),
        isConferenced: ['conferenced', 'awaiting_billing', 'invoiced', 'shipped', 'delivered'].includes(currentStatus),
      });

      if (!validation.valid) {
        throw new Error(validation.errors.join('\n'));
      }

      // Build update payload
      const updatePayload: Database['public']['Tables']['orders']['Update'] = { status: targetStatus, updated_at: new Date().toISOString() };

      // Set fulfillment sub-statuses
      if (targetStatus === 'awaiting_separation' || targetStatus === 'in_separation') {
        updatePayload.separation_status = targetStatus;
      }
      if (targetStatus === 'awaiting_conference') {
        updatePayload.conference_status = 'pending';
      }
      if (targetStatus === 'conferenced') {
        updatePayload.conference_status = 'completed';
      }
      if (targetStatus === 'awaiting_billing') {
        updatePayload.billing_status = 'awaiting';
      }
      if (targetStatus === 'invoiced') {
        updatePayload.billing_status = 'billed';
      }
      if (targetStatus === 'shipped') {
        updatePayload.shipment_status = 'dispatched';
      }
      if (targetStatus === 'delivered') {
        updatePayload.shipment_status = 'delivered';
        updatePayload.fulfillment_status = 'fulfilled';
      }
      if (targetStatus === 'in_production' || targetStatus === 'awaiting_production') {
        updatePayload.production_status = targetStatus === 'in_production' ? 'in_progress' : 'pending';
      }

      // Update order
      const { error } = await supabase.from('orders').update(updatePayload).eq('id', orderId);
      if (error) throw error;

      // Update history with observation
      if (observation || blockReason) {
        // Small delay to let trigger create the history record first
        await new Promise(r => setTimeout(r, 200));
        await supabase.from('order_status_history')
          .update({ observation, block_reason: blockReason, changed_by: changedBy } as any)
          .eq('order_id', orderId)
          .order('created_at', { ascending: false })
          .limit(1);
      }

      // Execute downstream actions based on target status
      try {
        switch (targetStatus) {
          case 'confirmed':
          case 'awaiting_separation':
            await createStockReservations(order);
            break;

          case 'awaiting_conference':
            await createConferenceRecord(order);
            break;

          case 'awaiting_billing':
            await createBillingEntry(order);
            break;

          case 'invoiced':
            await generateReceivablesFromBilling(order);
            break;

          case 'shipped':
            await createShipmentOrder(order);
            break;

          case 'cancelled':
            await releaseStockReservations(orderId);
            break;
        }
      } catch (downstreamError) {
        console.error('Downstream action error:', downstreamError);
        // Don't fail the transition for downstream errors
      }

      return { orderId, from: currentStatus, to: targetStatus };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['order-status-history'] });
      qc.invalidateQueries({ queryKey: ['stock-reservations'] });
      qc.invalidateQueries({ queryKey: ['conference-records'] });
      qc.invalidateQueries({ queryKey: ['billing-queue'] });
      qc.invalidateQueries({ queryKey: ['shipment-orders'] });
      qc.invalidateQueries({ queryKey: ['accounts-receivable'] });
      toastSuccess('Status do pedido atualizado com sucesso!');
    },
    onError: (e: Error) => {
      toastError(e.message, undefined, 'Erro na transição');
    },
  });
}

/**
 * Check if all production orders for a sales order are completed
 * and auto-advance the order to awaiting_conference
 */
export async function checkProductionCompletion(orderNumber: string, orderId: string) {
  const { data: ops } = await supabase
    .from('production_orders')
    .select('status, quantity, produced_quantity')
    .ilike('order_number', `%${orderNumber}%`);

  if (!ops || ops.length === 0) return false;

  const allCompleted = ops.every(op => op.status === 'completed');
  const anyInProgress = ops.some(op => op.status === 'in_progress');

  if (allCompleted) {
    await supabase.from('orders').update({
      status: 'awaiting_conference',
      production_status: 'completed',
      updated_at: new Date().toISOString(),
    }).eq('id', orderId);
    return true;
  }

  if (anyInProgress) {
    const totalQty = ops.reduce((s, o) => s + o.quantity, 0);
    const producedQty = ops.reduce((s, o) => s + o.produced_quantity, 0);
    if (producedQty > 0 && producedQty < totalQty) {
      await supabase.from('orders').update({
        status: 'partial_production',
        production_status: 'partial',
        updated_at: new Date().toISOString(),
      }).eq('id', orderId);
    }
  }

  return false;
}
