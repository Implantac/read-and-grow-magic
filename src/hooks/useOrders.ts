import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';

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
      toast({ title: 'Pedido criado com sucesso!' });
    },
    onError: (e: any) => {
      console.error('Error creating order:', e);
      toast({ 
        title: 'Erro ao criar pedido', 
        description: e.message || 'Ocorreu um erro inesperado', 
        variant: 'destructive' 
      });
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
      toast({ title: 'Status do pedido atualizado!' });
    },
    onError: (e: any) => {
      console.error('Error updating order status:', e);
      toast({ 
        title: 'Erro ao atualizar status', 
        description: e.message, 
        variant: 'destructive' 
      });
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
      toast({ title: 'Pedido atualizado!' });
    },
    onError: (e: any) => {
      console.error('Error updating order fields:', e);
      toast({ 
        title: 'Erro ao atualizar pedido', 
        description: e.message, 
        variant: 'destructive' 
      });
    },
  });
}

export function useDeleteOrder() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', id)
        .single();
      
      if (fetchError || !order) throw new Error('Pedido não encontrado');

      const { error: deleteError } = await supabase.from('orders').delete().eq('id', id);
      if (deleteError) throw deleteError;

      return order;
    },
    onSuccess: (deletedOrder) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      
      toast({ 
        title: 'Pedido removido com sucesso!',
        description: `O pedido ${deletedOrder.number} foi excluído. Você tem 10 segundos para desfazer.`,
        duration: 10000,
        action: React.createElement(ToastAction, {
          altText: 'Desfazer exclusão',
          onClick: async () => {
            try {
              const { order_items, ...orderData } = deletedOrder;
              
              // Ensure we restore order_items with the restored order ID
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

              qc.invalidateQueries({ queryKey: ['orders'] });
              toast({ title: 'Pedido restaurado com sucesso!' });
            } catch (err: any) {
              toast({ title: 'Erro ao restaurar pedido', description: err.message, variant: 'destructive' });
            }
          }
        }, 'Desfazer') as unknown as any
      });
    },
    onError: (e: any) => {
      console.error('Error deleting order:', e);
      toast({ 
        title: 'Erro ao remover pedido', 
        description: e.message || 'Não foi possível excluir o pedido no momento.', 
        variant: 'destructive' 
      });
    },
  });
}
