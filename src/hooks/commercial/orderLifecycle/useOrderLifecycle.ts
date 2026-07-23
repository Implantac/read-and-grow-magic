import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { validateTransition } from '@/lib/orderFlowEngine';
import { toastSuccess, toastError } from '@/lib/toastHelpers';
import type { TransitionInput } from './types';
import { buildUpdatePayload } from './updatePayload';
import {
  createStockReservations,
  createConferenceRecord,
  createBillingEntry,
  generateReceivablesFromBilling,
  createShipmentOrder,
  releaseStockReservations,
} from './downstream';

export function useOrderLifecycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TransitionInput) => {
      const { orderId, order, targetStatus, observation, blockReason, changedBy } = input;
      const currentStatus = order.status;

      const validation = validateTransition(currentStatus, targetStatus, {
        hasFinancialApproval: order.financial_approval === 'approved',
        hasCommercialApproval: order.commercial_approval === 'approved',
        isBlocked: currentStatus === 'blocked',
        isSeparated: ['awaiting_conference', 'conferenced', 'awaiting_billing', 'invoiced', 'shipped', 'delivered'].includes(currentStatus),
        isConferenced: ['conferenced', 'awaiting_billing', 'invoiced', 'shipped', 'delivered'].includes(currentStatus),
      });

      if (!validation.valid) throw new Error(validation.errors.join('\n'));

      const updatePayload = buildUpdatePayload(targetStatus);

      const { error } = await supabase.from('orders').update(updatePayload).eq('id', orderId);
      if (error) throw error;

      if (observation || blockReason) {
        await new Promise(r => setTimeout(r, 200));
        await supabase.from('order_status_history')
          .update({ observation, block_reason: blockReason, changed_by: changedBy })
          .eq('order_id', orderId)
          .order('created_at', { ascending: false })
          .limit(1);
      }

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
      }

      return { orderId, from: currentStatus, to: targetStatus };
    },
    onSuccess: () => {
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
