import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
      const { data: countData } = await supabase.from('orders').select('id', { count: 'exact', head: true });
      const nextNum = `PED${String((countData as any)?.length || 0 + 1).padStart(4, '0')}`;

      const subtotal = input.items.reduce((s, i) => s + (i.quantity * i.unit_price - i.discount), 0);
      const discount = input.items.reduce((s, i) => s + i.discount, 0);
      const shipping = input.shipping || 0;
      const total = subtotal + shipping;

      const { data: order, error: orderError } = await supabase.from('orders').insert({
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
      }).select().single();
      if (orderError) throw orderError;

      const items = input.items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id || null,
        product_name: item.product_name,
        product_code: item.product_code,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount,
        total: item.quantity * item.unit_price - item.discount,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(items);
      if (itemsError) throw itemsError;

      return order;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast({ title: 'Pedido criado com sucesso!' });
    },
    onError: (e: any) => toast({ title: 'Erro ao criar pedido', description: e.message, variant: 'destructive' }),
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast({ title: 'Status do pedido atualizado!' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });
}
