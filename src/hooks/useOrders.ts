import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { useSystemParameters } from './useSystemParameters';
import { toastSuccess, toastError } from '@/lib/toastHelpers';

export interface DbOrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_code: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
}

export interface DbOrder {
  id: string;
  number: string;
  client_id: string | null;
  client_name: string;
  date: string;
  delivery_date: string | null;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  payment_method: string;
  payment_condition: string;
  status: string;
  priority: string;
  sales_rep_id: string | null;
  sales_rep_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  commercial_approval: string | null;
  financial_approval: string | null;
  approved_by: string | null;
  approved_at: string | null;
  commission_rate: number | null;
  commission_value: number | null;
  internal_notes: string | null;
  expected_billing_date: string | null;
  max_discount_pct: number | null;
  items?: DbOrderItem[];
}

export interface CreateOrderInput {
  client_id?: string | null;
  client_name: string;
  delivery_date?: string | null;
  payment_method: string;
  payment_condition: string;
  priority: string;
  shipping?: number;
  notes?: string | null;
  items: Array<{
    product_id?: string | null;
    product_name: string;
    product_code: string;
    quantity: number;
    unit_price: number;
    discount: number;
  }>;
}

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as any[]).map((o) => ({
        ...o,
        items: o.order_items || [],
      })) as DbOrder[];
    },
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: CreateOrderInput) => {
      const { data: lastOrder } = await supabase
        .from('orders')
        .select('number')
        .order('number', { ascending: false })
        .limit(1)
        .maybeSingle();

      const lastNum = lastOrder?.number?.replace('PED', '') || '0';
      const nextNum = `PED${String(parseInt(lastNum) + 1).padStart(4, '0')}`;

      const subtotal = input.items.reduce((s, i) => s + (i.quantity * i.unit_price), 0);
      const discount = input.items.reduce((s, i) => s + i.discount, 0);
      const shipping = input.shipping || 0;
      const total = subtotal - discount + shipping;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          number: nextNum,
          client_id: input.client_id || null,
          client_name: input.client_name,
          delivery_date: input.delivery_date || null,
          payment_method: input.payment_method,
          payment_condition: input.payment_condition,
          priority: input.priority,
          subtotal,
          discount,
          shipping,
          total,
          notes: input.notes || null,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const items = input.items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id || null,
        product_name: item.product_name,
        product_code: item.product_code,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount,
        total: (item.quantity * item.unit_price) - item.discount,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(items);
      if (itemsError) {
        await supabase.from('orders').delete().eq('id', order.id);
        throw itemsError;
      }

      return order;
    },
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
  const { toast } = useToast();
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
    onError: (e: any) => {
      console.error('Error updating order status:', e);
      toastError(e.message, undefined, 'Erro ao atualizar status');
    },
  });
}

export function useUpdateOrderFields() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...fields }: { id: string; [key: string]: any }) => {
      const { error } = await supabase
        .from('orders')
        .update({ ...fields, updated_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      toastSuccess('Pedido atualizado!');
    },
    onError: (e: any) => {
      console.error('Error updating order fields:', e);
      toastError(e.message, undefined, 'Erro ao atualizar pedido');
    },
  });
}

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
          expires_at: expiresAt
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
      let interval: any;

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
              
              const { data: restored, error: restError } = await supabase.from('orders').insert(orderData).select().single();
              if (restError) throw restError;

              if (order_items && order_items.length > 0) {
                const restoredItems = order_items.map((item: any) => ({
                  ...item,
                  order_id: restored.id
                }));
                const { error: itemsError } = await supabase.from('order_items').insert(restoredItems);
                if (itemsError) throw itemsError;
              }

              await supabase.from('deleted_orders_archive').delete().eq('id', archiveId);

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
