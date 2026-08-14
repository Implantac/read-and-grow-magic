import { supabase } from "@/integrations/supabase/client";
import { stockEngine } from "./stockEngine";

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
  | 'ENCERRADA';

export interface WorkflowTransition {
  transferId: string;
  fromStatus: TransferStatus;
  toStatus: TransferStatus;
  userId: string;
  quantity?: number;
  divergence?: number;
  notes?: string;
}

export const transferWorkflow = {
  async transition({
    transferId,
    toStatus,
    userId,
    quantity = 0,
    divergence = 0,
    notes = ''
  }: Omit<WorkflowTransition, 'fromStatus'>) {
    
    // 1. Registrar o log do workflow
    const { error: logError } = await supabase
      .from('stock_transfer_workflow_logs')
      .insert({
        transfer_id: transferId,
        user_id: userId,
        status: toStatus,
        quantity,
        divergence,
        notes
      });

    if (logError) throw logError;

    // 2. Atualizar o status atual na ordem de transferência
    const { error: updateError } = await supabase
      .from('stock_transfer_orders')
      .update({ current_status: toStatus })
      .eq('id', transferId);

    if (updateError) throw updateError;

    // 3. Efeitos colaterais no estoque (Lógica Centralizada)
    // Nota: Em um sistema robusto, isso seria um trigger ou RPC, 
    // mas aqui seguimos a arquitetura de serviços definida no plano.
    
    // TODO: Implementar atualizações atômicas de stock_balances baseado no status
    // Ex: 'RESERVADA' -> Incrementar reserved_quantity na origem
    // Ex: 'EXPEDIDA' -> Decrementar físico e reserved na origem, Incrementar in_transit na origem
    
    return { success: true };
  },

  async getHistory(transferId: string) {
    const { data, error } = await supabase
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
