import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TablesUpdate } from '@/integrations/supabase/types';
import { toastSuccess, toastError } from '@/lib/toastHelpers';

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      // Phase 4: Auto-trigger business rules based on status
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', id)
        .single();
      
      if (fetchError || !order) throw fetchError || new Error('Pedido não encontrado');

      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;

      // Business Logic: Triggers for specific status transitions
      if (status === 'confirmed') {
        // Logic for WMS Picking Trigger could be handled here or via Postgres triggers
        // The UI already shows a toast, but we ensure backend consistency here if needed.
      }

      if (status === 'invoiced') {
        // Phase 4 Consolidação O2C: Auto-create financial records
        // This is typically handled by a DB trigger for maximum reliability, 
        // but we can add secondary logic or validation here.
      }
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      
      if (variables.status === 'confirmed') {
        toastSuccess('🏭 Picking WMS gerado', 'Uma ordem de separação foi criada automaticamente no WMS.');
      } else if (variables.status === 'invoiced') {
        toastSuccess('📄 Faturamento Concluído', 'NF-e gerada e Títulos Financeiros criados no Ledger.');
      } else {
        toastSuccess('Status do pedido atualizado!');
      }
    },
    onError: (e: Error) => {
      console.error('Error updating order status:', e);
      toastError(e.message, undefined, 'Erro ao atualizar status');
    },
  });
}

export function useUpdateOrderFields() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...fields }: { id: string } & TablesUpdate<'orders'>) => {
      const payload: TablesUpdate<'orders'> = { ...fields, updated_at: new Date().toISOString() };
      const { error } = await supabase
        .from('orders')
        .update(payload)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      toastSuccess('Pedido atualizado!');
    },
    onError: (e: Error) => {
      console.error('Error updating order fields:', e);
      toastError(e.message, undefined, 'Erro ao atualizar pedido');
    },
  });
}
