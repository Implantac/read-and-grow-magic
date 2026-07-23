import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TablesUpdate } from '@/integrations/supabase/types';
import { toastSuccess, toastError } from '@/lib/toastHelpers';

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      toastSuccess('Status do pedido atualizado!');
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
