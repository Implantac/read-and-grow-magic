import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/ui/base/toast';
import { useSystemParameters } from '@/hooks/system/useSystemParameters';
import { toastSuccess, toastError } from '@/lib/toastHelpers';
import type { DbOrderItem } from './types';

export function useDeleteOrder() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { getParameter } = useSystemParameters();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', id)
        .single();

      if (fetchError || !order) throw new Error('Pedido não encontrado');

      const undoSeconds = Number(getParameter('undo_duration_seconds', '10'));
      const expiresAt = new Date(Date.now() + undoSeconds * 1000).toISOString();

      const { data: archiveData, error: archiveError } = await supabase
        .from('deleted_orders_archive')
        .insert({
          original_order_id: id,
          order_data: order,
          expires_at: expiresAt,
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
    },
    onSuccess: ({ order: deletedOrder, archiveId }) => {
      qc.invalidateQueries({ queryKey: ['orders'] });

      const undoSeconds = Number(getParameter('undo_duration_seconds', '10'));
      const durationMs = undoSeconds * 1000;
      let timeLeft = undoSeconds;
      // eslint-disable-next-line prefer-const
      let interval: ReturnType<typeof setInterval> | undefined;

      const createAction = (disabled = false) =>
        React.createElement(ToastAction, {
          altText: 'Desfazer exclusão',
          disabled: disabled,
          onClick: async () => {
            if (interval) clearInterval(interval);
            try {
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

              const { data: restored, error: restError } = await supabase
                .from('orders')
                .insert(orderData as TablesInsert<'orders'>)
                .select()
                .single();
              if (restError) throw restError;

              if (order_items && order_items.length > 0) {
                const restoredItems = order_items.map((item: DbOrderItem) => ({
                  ...item,
                  order_id: restored.id,
                }));
                const { error: itemsError } = await supabase
                  .from('order_items')
                  .insert(restoredItems as TablesInsert<'order_items'>[]);
                if (itemsError) throw itemsError;
              }

              await supabase.from('deleted_orders_archive').delete().eq('id', archiveId);

              qc.invalidateQueries({ queryKey: ['orders'] });
              toastSuccess('Pedido restaurado com sucesso!');
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Erro inesperado';
              toastError(message, undefined, 'Erro ao restaurar pedido');
            }
          },
        }, 'Desfazer');

      const { id, update } = toast({
        title: 'Pedido removido com sucesso!',
        description: `O pedido ${deletedOrder.number} foi excluído. Você tem ${timeLeft} segundos para desfazer.`,
        duration: durationMs,
        action: createAction() as unknown as React.ReactElement,
      });

      interval = setInterval(() => {
        timeLeft -= 1;
        if (timeLeft <= 0) {
          if (interval) clearInterval(interval);
          update({
            id,
            description: `O pedido ${deletedOrder.number} foi excluído permanentemente.`,
            action: createAction(true) as unknown as React.ReactElement,
          });
        } else {
          update({
            id,
            description: `O pedido ${deletedOrder.number} foi excluído. Você tem ${timeLeft} segundos para desfazer.`,
          });
        }
      }, 1000);
    },
    onError: (e: Error) => {
      console.error('Error deleting order:', e);
      toastError(e.message || 'Não foi possível excluir o pedido no momento.', undefined, 'Erro ao remover pedido');
    },
  });
}
