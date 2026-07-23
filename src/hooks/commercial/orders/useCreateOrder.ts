import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';
import { toastSuccess, toastError } from '@/lib/toastHelpers';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import type { CreateOrderInput } from './types';

export function useCreateOrder() {
  const qc = useQueryClient();
  const { currentCompany } = useEnterprise();
  return useMutation({
    mutationFn: async (input: CreateOrderInput) => {
      if (!currentCompany?.id) throw new Error('Empresa não selecionada');

      let safeClientId: string | null = input.client_id || null;
      if (safeClientId) {
        const { data: clientRow, error: clientErr } = await supabase
          .from('clients')
          .select('id')
          .eq('id', safeClientId)
          .eq('company_id', currentCompany.id)
          .maybeSingle();
        if (clientErr) throw clientErr;
        if (!clientRow) safeClientId = null;
      }

      const { data: lastOrder } = await supabase
        .from('orders')
        .select('number')
        .eq('company_id', currentCompany.id)
        .order('number', { ascending: false })
        .limit(1)
        .maybeSingle();

      const lastNum = lastOrder?.number?.replace('PED', '') || '0';
      const nextNum = `PED${String(parseInt(lastNum) + 1).padStart(4, '0')}`;

      const subtotal = input.items.reduce((s, i) => s + (i.quantity * i.unit_price), 0);
      const discount = input.items.reduce((s, i) => s + i.discount, 0);
      const shipping = input.shipping || 0;
      const total = subtotal - discount + shipping;

      const productIds = input.items.map((i) => i.product_id).filter(Boolean) as string[];
      const costMap = new Map<string, number>();
      if (productIds.length > 0) {
        const { data: prodCosts } = await supabase
          .from('products')
          .select('id, cost_price')
          .in('id', productIds);
        (prodCosts ?? []).forEach((p: any) => costMap.set(p.id, Number(p.cost_price) || 0));
      }
      const estimated_cost = input.items.reduce(
        (s, i) => s + (i.product_id ? (costMap.get(i.product_id) ?? 0) : 0) * i.quantity,
        0,
      );
      const estimated_tax = total * (0.18 + 0.0165 + 0.076);
      const netMargin = total - estimated_cost - estimated_tax;
      const estimated_margin_pct = total > 0 ? Number(((netMargin / total) * 100).toFixed(2)) : 0;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          company_id: currentCompany.id,
          number: nextNum,
          client_id: safeClientId,
          client_name: input.client_name,
          delivery_date: input.delivery_date || null,
          payment_method: input.payment_method,
          payment_condition: input.payment_condition,
          priority: input.priority,
          subtotal,
          discount,
          shipping,
          total,
          estimated_cost: Number(estimated_cost.toFixed(2)),
          estimated_tax: Number(estimated_tax.toFixed(2)),
          estimated_margin_pct,
          notes: input.notes || null,
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (orderError) {
        console.error('[useCreateOrder] insert failed', {
          code: orderError.code,
          message: orderError.message,
          details: orderError.details,
          hint: orderError.hint,
        });
        throw orderError;
      }

      const items = input.items.map((item) => ({
        company_id: currentCompany.id,
        order_id: order.id,
        product_id: item.product_id || null,
        product_name: item.product_name,
        product_code: item.product_code,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount,
        total: (item.quantity * item.unit_price) - item.discount,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(items as TablesInsert<'order_items'>[]);
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
    onError: (e: Error) => {
      console.error('Error creating order:', e);
      toastError(e.message || 'Ocorreu um erro inesperado', undefined, 'Erro ao criar pedido');
    },
  });
}
