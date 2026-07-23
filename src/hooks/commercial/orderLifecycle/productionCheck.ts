import { supabase } from '@/integrations/supabase/client';

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
