import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { useSystemParameters } from '../useSystemParameters';
import { toastSuccess, toastError } from '@/lib/toastHelpers';
import { orderService } from '@/services/commercial/orderService';
import { DbOrder, CreateOrderInput } from '../useOrders';

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: () => orderService.getAllOrders(),
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrderInput) => orderService.createOrder(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      toastSuccess('Pedido criado com sucesso!');
    },
    onError: (e: any) => {
      console.error('Error creating order:', e);
      toastError(e.message || 'Ocorreu um erro inesperado', undefined, 'Erro ao criar pedido');
    },
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => orderService.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      toastSuccess('Status do pedido atualizado!');
    },
    onError: (e: any) => {
      console.error('Error updating order status:', e);
      toastError(e.message, undefined, 'Erro ao atualizar status');
    },
  });
}

export function useDeleteOrder() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { getParameter } = useSystemParameters();

  return useMutation({
    mutationFn: async (id: string) => {
      const undoSeconds = Number(getParameter('undo_duration_seconds', '10'));
      return orderService.archiveForDeletion(id, undoSeconds);
    },
    onSuccess: ({ order: deletedOrder, archiveId }) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      
      const undoSeconds = Number(getParameter('undo_duration_seconds', '10'));
      const durationMs = undoSeconds * 1000;
      let timeLeft = undoSeconds;
      let interval: any;

      const createAction = (disabled = false) => 
        React.createElement(ToastAction, {
          altText: 'Desfazer exclusão',
          disabled: disabled,
          onClick: async () => {
            if (interval) clearInterval(interval);
            try {
              await orderService.restoreOrder(archiveId, deletedOrder);
              qc.invalidateQueries({ queryKey: ['orders'] });
              toastSuccess('Pedido restaurado com sucesso!');
            } catch (err: any) {
              toastError(err.message, undefined, 'Erro ao restaurar pedido');
            }
          }
        }, 'Desfazer');

      const { id, update } = toast({ 
        title: 'Pedido removido com sucesso!',
        description: `O pedido ${deletedOrder.number} foi excluído. Você tem ${timeLeft} segundos para desfazer.`,
        duration: durationMs,
        action: createAction() as unknown as any
      });

      interval = setInterval(() => {
        timeLeft -= 1;
        if (timeLeft <= 0) {
          clearInterval(interval);
          update({
            id,
            description: `O pedido ${deletedOrder.number} foi excluído permanentemente.`,
            action: createAction(true) as unknown as any,
          } as any);
        } else {
          update({
            id,
            description: `O pedido ${deletedOrder.number} foi excluído. Você tem ${timeLeft} segundos para desfazer.`,
          } as any);
        }
      }, 1000);
    },
    onError: (e: any) => {
      console.error('Error deleting order:', e);
      toastError(e.message || 'Não foi possível excluir o pedido no momento.', undefined, 'Erro ao remover pedido');
    },
  });
}
