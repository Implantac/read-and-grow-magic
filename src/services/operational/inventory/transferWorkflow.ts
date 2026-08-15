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
  | 'CONFERIDA' 
  | 'ENCERRADA'
  | 'CANCELADA';


export interface WorkflowTransition {
  transferId: string;
  fromStatus: TransferStatus;
  toStatus: TransferStatus;
  userId: string;
  quantity?: number;
  divergence?: number;
  notes?: string;
  correlationId?: string;
}

export const transferWorkflow = {
  async transition({
    transferId,
    toStatus,
    userId,
    quantity = 0,
    divergence = 0,
    notes = '',
    correlationId
  }: Omit<WorkflowTransition, 'fromStatus'>) {
    
    // 1. Registrar o log do workflow
    const { error: logError } = await supabase
      .from('stock_transfer_workflow_logs')
      .insert({
        transfer_id: transferId,
        user_id: userId,
        status: toStatus as any,
        quantity,
        divergence,
        notes
      });


    if (logError) throw logError;

    // 2. Atualizar o status atual na ordem de transferência e propagar correlação
    const { error: updateError } = await (supabase as any)
      .from('stock_transfer_orders')
      .update({ 
        current_status: toStatus as any,
        correlation_id: correlationId || null
      })
      .eq('id', transferId);

    if (updateError) throw updateError;

    // 2.1 Publish event for orchestration
    const eventBus = useEventBus.getState();
    await eventBus.publish('WORKFLOW_COMPLETED', {
      transferId,
      status: toStatus,
      type: 'TRANSFER',
      userId,
      correlationId,
      companyId: order?.company_id
    });

    // 3. Efeitos colaterais no estoque (Lógica Centralizada)
    const { data: order } = await (supabase as any)
      .from('stock_transfer_orders')
      .select('*, items:stock_transfer_items(*)')
      .eq('id', transferId)
      .single();

    if (order && order.items && order.items.length > 0) {
      for (const item of order.items) {
        if (toStatus === 'RESERVADA') {
          // Reservar estoque na origem
          await (supabase as any).rpc('adjust_stock', {
            p_branch_id: order.origin_unit_id,
            p_product_id: item.product_id,
            p_quantity: 0,
            p_reserved: quantity || item.requested_qty
          });
        } else if (toStatus === 'EXPEDIDA') {
          // Baixa físico e reserva na origem
          await (supabase as any).rpc('adjust_stock', {
            p_branch_id: order.origin_unit_id,
            p_product_id: item.product_id,
            p_quantity: -(quantity || item.requested_qty),
            p_reserved: -(quantity || item.requested_qty),
            p_transit_in: 0
          });
          // Aumenta trânsito no destino
          await (supabase as any).rpc('adjust_stock', {
            p_branch_id: order.destination_unit_id,
            p_product_id: item.product_id,
            p_quantity: 0,
            p_reserved: 0,
            p_transit_in: quantity || item.requested_qty
          });
        } else if (toStatus === 'RECEBIDA') {
          // Baixa trânsito e aumenta físico no destino
          await (supabase as any).rpc('adjust_stock', {
            p_branch_id: order.destination_unit_id,
            p_product_id: item.product_id,
            p_quantity: quantity || item.requested_qty,
            p_reserved: 0,
            p_transit_in: -(quantity || item.requested_qty)
          });

          // Registrar divergência se houver
          if (divergence > 0) {
            await supabase
              .from('stock_transfer_divergences')
              .insert({
                transfer_id: transferId,
                product_id: item.product_id,
                expected_qty: item.requested_qty,
                actual_qty: quantity,
                divergence_qty: divergence,
                reason: 'CONFERENCIA',
                notes
              });
          }
        }
      }
    }
    
    return { success: true };
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
  }
};
