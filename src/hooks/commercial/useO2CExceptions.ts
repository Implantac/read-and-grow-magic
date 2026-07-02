import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type O2CExceptionType =
  | 'confirmed_without_picking'
  | 'invoiced_without_nfe'
  | 'delivered_without_ar'
  | 'stuck_pending'
  | 'stuck_separated';

export interface O2CException {
  type: O2CExceptionType;
  order_id: string;
  order_number: string;
  client_name: string;
  status: string;
  total: number;
  date: string;
  days_stuck: number;
  detail: string;
}

const LABELS: Record<O2CExceptionType, string> = {
  confirmed_without_picking: 'Confirmado sem Picking WMS',
  invoiced_without_nfe: 'Faturado sem NF-e',
  delivered_without_ar: 'Entregue sem Contas a Receber',
  stuck_pending: 'Pendente há mais de 3 dias',
  stuck_separated: 'Separado há mais de 5 dias',
};

export const exceptionLabel = (t: O2CExceptionType) => LABELS[t];

const daysBetween = (iso: string) => {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
};

export function useO2CExceptions() {
  return useQuery({
    queryKey: ['o2c-exceptions'],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<O2CException[]> => {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('id, number, client_name, status, total, date, created_at')
        .neq('status', 'cancelled')
        .order('date', { ascending: false })
        .limit(500);
      if (error) throw error;

      const orderIds = (orders ?? []).map((o) => o.id);
      if (orderIds.length === 0) return [];

      const [pickingRes, nfeRes, arRes] = await Promise.all([
        supabase.from('wms_picking_orders').select('order_id').in('order_id', orderIds),
        supabase.from('nfe').select('order_id').in('order_id', orderIds),
        supabase.from('accounts_receivable').select('sale_id').in('sale_id', orderIds),
      ]);

      const pickingSet = new Set((pickingRes.data ?? []).map((r: any) => r.order_id));
      const nfeSet = new Set((nfeRes.data ?? []).map((r: any) => r.order_id));
      const arSet = new Set((arRes.data ?? []).map((r: any) => r.sale_id));

      const out: O2CException[] = [];
      const advancedStatuses = ['confirmed', 'processing', 'separated', 'invoiced', 'shipped', 'delivered'];
      const invoicedOrLater = ['invoiced', 'shipped', 'delivered'];

      for (const o of orders ?? []) {
        const days = daysBetween(o.date || o.created_at);
        const base = {
          order_id: o.id, order_number: o.number, client_name: o.client_name,
          status: o.status, total: Number(o.total || 0), date: o.date, days_stuck: days,
        };
        if (advancedStatuses.includes(o.status) && !pickingSet.has(o.id)) {
          out.push({ ...base, type: 'confirmed_without_picking', detail: 'Nenhuma ordem de separação WMS encontrada.' });
        }
        if (invoicedOrLater.includes(o.status) && !nfeSet.has(o.id)) {
          out.push({ ...base, type: 'invoiced_without_nfe', detail: 'Pedido faturado sem NF-e vinculada.' });
        }
        if (o.status === 'delivered' && !arSet.has(o.id)) {
          out.push({ ...base, type: 'delivered_without_ar', detail: 'Pedido entregue sem lançamento em AR.' });
        }
        if (o.status === 'pending' && days > 3) {
          out.push({ ...base, type: 'stuck_pending', detail: `Aguardando confirmação há ${days} dias.` });
        }
        if (o.status === 'separated' && days > 5) {
          out.push({ ...base, type: 'stuck_separated', detail: `Separado há ${days} dias sem faturamento.` });
        }
      }
      return out.sort((a, b) => b.days_stuck - a.days_stuck);
    },
  });
}
