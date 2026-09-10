import { supabase } from "@/integrations/supabase/client";
import { useEventBus } from "@/core/events/useEventBus";

export type TransferStatus =
  | 'SUGERIDA'
  | 'APROVADA'
  | 'RESERVADA'
  | 'SEPARAÇÃO'
  | 'CONFERÊNCIA'
  | 'EXPEDIDA'
  | 'EM TRÂNSITO'
  | 'RECEBIDA'
  | 'RECEBIDA PARCIAL'
  | 'RECEBIDA COM DIVERGÊNCIA'
  | 'CONFERIDA'
  | 'ENCERRADA'
  | 'REJEITADA'
  | 'CANCELADA';

export type DivergenceReason = 'FALTA' | 'EXCESSO' | 'AVARIA' | 'PRODUTO_ERRADO';

/** Quantidade conferida por item da transferência. */
export interface ItemQuantity {
  itemId: string;
  quantity: number;
  divergenceReason?: DivergenceReason;
  notes?: string;
}

export interface WorkflowTransition {
  transferId: string;
  fromStatus: TransferStatus;
  toStatus: TransferStatus;
  userId: string;
  /** Quantidades por item (fonte da verdade). Sem isso, usa a quantidade solicitada de cada item. */
  itemQuantities?: ItemQuantity[];
  notes?: string;
  correlationId?: string;
}

const RECEIVED_STATUSES: TransferStatus[] = ['RECEBIDA', 'RECEBIDA PARCIAL', 'RECEBIDA COM DIVERGÊNCIA'];
const TERMINAL_STATUSES: TransferStatus[] = ['ENCERRADA', 'CANCELADA', 'REJEITADA'];

/** Transições válidas: impede saltos de etapa e repetição do mesmo estado. */
export const ALLOWED_TRANSITIONS: Record<TransferStatus, TransferStatus[]> = {
  'SUGERIDA': ['APROVADA', 'REJEITADA', 'CANCELADA'],
  'APROVADA': ['RESERVADA', 'CANCELADA'],
  'RESERVADA': ['SEPARAÇÃO', 'CANCELADA'],
  'SEPARAÇÃO': ['CONFERÊNCIA', 'CANCELADA'],
  'CONFERÊNCIA': ['EXPEDIDA', 'CANCELADA'],
  'EXPEDIDA': ['EM TRÂNSITO'],
  'EM TRÂNSITO': ['RECEBIDA', 'RECEBIDA PARCIAL', 'RECEBIDA COM DIVERGÊNCIA'],
  'RECEBIDA': ['CONFERIDA', 'ENCERRADA'],
  'RECEBIDA PARCIAL': ['CONFERIDA', 'ENCERRADA'],
  'RECEBIDA COM DIVERGÊNCIA': ['CONFERIDA', 'ENCERRADA'],
  'CONFERIDA': ['ENCERRADA'],
  'ENCERRADA': [],
  'REJEITADA': [],
  'CANCELADA': [],
};

export function canTransition(from: TransferStatus, to: TransferStatus) {
  return (ALLOWED_TRANSITIONS[from] || []).includes(to);
}

export function nextStatuses(from: TransferStatus) {
  return ALLOWED_TRANSITIONS[from] || [];
}

export const transferWorkflow = {
  async transition({
    transferId,
    toStatus,
    userId,
    itemQuantities,
    notes = '',
    correlationId,
  }: Omit<WorkflowTransition, 'fromStatus'>) {
    // 1. Estado atual + itens (guarda contra salto e repetição)
    const { data: order, error: orderError } = await (supabase as any)
      .from('stock_transfer_orders')
      .select('*, items:stock_transfer_items(*)')
      .eq('id', transferId)
      .single();

    if (orderError) throw orderError;
    if (!order) throw new Error('Transferência não encontrada');

    const fromStatus: TransferStatus = (order.current_status || 'SUGERIDA') as TransferStatus;

    if (fromStatus === toStatus) {
      throw new Error(`A transferência já está em "${toStatus}".`);
    }
    if (TERMINAL_STATUSES.includes(fromStatus)) {
      throw new Error(`Transferência ${fromStatus.toLowerCase()}: não é possível alterar.`);
    }
    if (!canTransition(fromStatus, toStatus)) {
      throw new Error(`Transição inválida: de "${fromStatus}" para "${toStatus}".`);
    }

    const items: any[] = order.items || [];
    const qtyFor = (item: any) => {
      const match = itemQuantities?.find((q) => q.itemId === item.id);
      if (match && Number.isFinite(match.quantity)) return Number(match.quantity);
      return Number(item.requested_qty || 0);
    };

    const totalQty = items.reduce((sum, item) => sum + qtyFor(item), 0);
    const totalDivergence = RECEIVED_STATUSES.includes(toStatus)
      ? items.reduce((sum, item) => sum + Math.abs(Number(item.requested_qty || 0) - qtyFor(item)), 0)
      : 0;

    // 2. Log do workflow
    const { error: logError } = await supabase
      .from('stock_transfer_workflow_logs')
      .insert({
        transfer_id: transferId,
        user_id: userId,
        status: toStatus as any,
        quantity: totalQty,
        divergence: totalDivergence,
        notes,
      });
    if (logError) throw logError;

    // 3. Atualizar ordem
    const orderUpdate: Record<string, unknown> = {
      current_status: toStatus as any,
      updated_at: new Date().toISOString(),
    };
    if (correlationId) orderUpdate.correlation_id = correlationId;
    if (toStatus === 'EXPEDIDA') orderUpdate.shipped_at = new Date().toISOString();
    if (RECEIVED_STATUSES.includes(toStatus)) orderUpdate.received_at = new Date().toISOString();
    if (toStatus === 'APROVADA') orderUpdate.approved_by = userId;

    const { error: updateError } = await (supabase as any)
      .from('stock_transfer_orders')
      .update(orderUpdate)
      .eq('id', transferId);
    if (updateError) throw updateError;

    // 4. Evento de orquestração
    const eventBus = useEventBus.getState();
    await eventBus.publish('WORKFLOW_COMPLETED', {
      transferId,
      status: toStatus,
      type: 'TRANSFER',
      userId,
      correlationId,
      companyId: order.company_id,
    });

    // 5. Efeitos no estoque — sempre por item
    for (const item of items) {
      const qty = qtyFor(item);
      const requested = Number(item.requested_qty || 0);

      if (toStatus === 'RESERVADA') {
        await (supabase as any).rpc('adjust_stock', {
          p_branch_id: order.origin_unit_id,
          p_product_id: item.product_id,
          p_quantity: 0,
          p_reserved: requested,
        });
      } else if (toStatus === 'EXPEDIDA') {
        await (supabase as any).rpc('adjust_stock', {
          p_branch_id: order.origin_unit_id,
          p_product_id: item.product_id,
          p_quantity: -qty,
          p_reserved: -requested,
          p_transit_in: 0,
        });
        await (supabase as any).rpc('adjust_stock', {
          p_branch_id: order.destination_unit_id,
          p_product_id: item.product_id,
          p_quantity: 0,
          p_reserved: 0,
          p_transit_in: qty,
        });
        await supabase
          .from('stock_transfer_items')
          .update({ shipped_qty: qty })
          .eq('id', item.id);
      } else if (RECEIVED_STATUSES.includes(toStatus)) {
        const shipped = Number(item.shipped_qty ?? requested);
        await (supabase as any).rpc('adjust_stock', {
          p_branch_id: order.destination_unit_id,
          p_product_id: item.product_id,
          p_quantity: qty,
          p_reserved: 0,
          p_transit_in: -shipped,
        });
        await supabase
          .from('stock_transfer_items')
          .update({ received_qty: qty })
          .eq('id', item.id);

        const diff = qty - shipped;
        if (diff !== 0) {
          const declared = itemQuantities?.find((q) => q.itemId === item.id);
          await supabase.from('stock_transfer_divergences').insert({
            transfer_id: transferId,
            item_id: item.id,
            product_id: item.product_id,
            expected_qty: shipped,
            actual_qty: qty,
            divergence_qty: Math.abs(diff),
            reason: declared?.divergenceReason || (diff < 0 ? 'FALTA' : 'EXCESSO'),
            notes: declared?.notes || notes || null,
            created_by: userId,
          } as any);
        }
      } else if (toStatus === 'CANCELADA' || toStatus === 'REJEITADA') {
        // Libera reserva se já havia sido reservada e nada saiu fisicamente
        if (['RESERVADA', 'SEPARAÇÃO', 'CONFERÊNCIA'].includes(fromStatus)) {
          await (supabase as any).rpc('adjust_stock', {
            p_branch_id: order.origin_unit_id,
            p_product_id: item.product_id,
            p_quantity: 0,
            p_reserved: -requested,
          });
        }
      }
    }

    return { success: true, fromStatus, toStatus };
  },

  async getHistory(transferId: string) {
    const { data, error } = await (supabase as any)
      .from('stock_transfer_workflow_logs')
      .select(`
        *,
        profiles:user_id (name)
      `)
      .eq('transfer_id', transferId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getDivergences(transferId: string) {
    const { data, error } = await (supabase as any)
      .from('stock_transfer_divergences')
      .select('*, product:product_id(name, code)')
      .eq('transfer_id', transferId);
    if (error) throw error;
    return data || [];
  },
};
