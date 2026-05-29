import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import { handleMutationError, mutationErrorHandler, toastSuccess } from '@/lib/toastHelpers';
export interface DbQuotationItem {
  id: string;
  quotation_id: string;
  product_id: string | null;
  product_name: string;
  product_code: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
}

export interface DbQuotation {
  id: string;
  number: string;
  client_id: string | null;
  client_name: string;
  date: string;
  valid_until: string;
  subtotal: number;
  discount: number;
  total: number;
  status: string;
  sales_rep_id: string | null;
  sales_rep_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: DbQuotationItem[];
}

export interface CreateQuotationInput {
  client_id?: string | null;
  client_name: string;
  valid_until: string;
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

export function useQuotations() {
  return useQuery({
    queryKey: ['quotations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotations')
        .select('*, quotation_items(*)')
        .order('date', { ascending: false });
      if (error) throw error;
      return (data as any[]).map((q) => ({
        ...q,
        items: q.quotation_items || [],
      })) as DbQuotation[];
    },
  });
}

export function useCreateQuotation() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: CreateQuotationInput) => {
      const { count } = await supabase.from('quotations').select('id', { count: 'exact', head: true });
      const nextNum = `ORC${String((count || 0) + 1).padStart(4, '0')}`;

      const subtotal = input.items.reduce((s, i) => s + (i.quantity * i.unit_price), 0);
      const discount = input.items.reduce((s, i) => s + i.discount, 0);
      const total = subtotal - discount;

      const { data: quotation, error: qError } = await supabase.from('quotations').insert({
        number: nextNum,
        client_id: input.client_id || null,
        client_name: input.client_name,
        valid_until: input.valid_until,
        subtotal,
        discount,
        total,
        notes: input.notes || null,
        status: 'draft',
      }).select().single();
      if (qError) throw qError;

      const items = input.items.map((item) => ({
        quotation_id: quotation.id,
        product_id: item.product_id || null,
        product_name: item.product_name,
        product_code: item.product_code,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount,
        total: item.quantity * item.unit_price - item.discount,
      }));

      const { error: itemsError } = await supabase.from('quotation_items').insert(items);
      if (itemsError) throw itemsError;

      return quotation;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotations'] });
      toastSuccess('Orçamento criado com sucesso!');
    },
    onError: mutationErrorHandler('Erro ao criar orçamento'),
  });
}

export function useUpdateQuotationStatus() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('quotations').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotations'] });
    },
    onError: handleMutationError,
  });
}

export function useConvertQuotationToOrder() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (quotation: DbQuotation) => {
      // Generate order number
      const { count } = await supabase.from('orders').select('id', { count: 'exact', head: true });
      const nextNum = `PED${String((count || 0) + 1).padStart(4, '0')}`;

      // Create order from quotation
      const { data: order, error: orderError } = await supabase.from('orders').insert({
        number: nextNum,
        client_id: quotation.client_id,
        client_name: quotation.client_name,
        subtotal: quotation.subtotal,
        discount: quotation.discount,
        total: quotation.total,
        payment_method: 'boleto',
        payment_condition: 'À vista',
        priority: 'medium',
        notes: `Convertido do orçamento ${quotation.number}`,
        status: 'pending',
      }).select().single();
      if (orderError) throw orderError;

      // Copy items
      if (quotation.items && quotation.items.length > 0) {
        const orderItems = quotation.items.map((item) => ({
          order_id: order.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_code: item.product_code,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount,
          total: item.total,
        }));
        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
        if (itemsError) throw itemsError;
      }

      // Update quotation status
      await supabase.from('quotations').update({ status: 'converted', updated_at: new Date().toISOString() }).eq('id', quotation.id);

      return order;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotations'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      toastSuccess('Orçamento convertido em pedido com sucesso!');
    },
    onError: mutationErrorHandler('Erro ao converter'),
  });
}
