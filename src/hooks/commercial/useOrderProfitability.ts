import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { LineItem } from '@/components/commercial/OrderItemsEditor';

// Alíquotas de referência (fallback quando não há regra fiscal cadastrada).
// Substituídas por tax_rules quando disponíveis no futuro.
const DEFAULT_ICMS = 0.18;
const DEFAULT_PIS = 0.0165;
const DEFAULT_COFINS = 0.076;

export interface OrderProfitability {
  gross: number;
  discountTotal: number;
  net: number;
  cogs: number;
  taxes: {
    icms: number;
    pis: number;
    cofins: number;
    total: number;
  };
  grossMargin: number;   // net - cogs
  netMargin: number;     // net - cogs - taxes
  marginPct: number;     // netMargin / net * 100
  perLine: Array<{
    product_id: string | null | undefined;
    product_name: string;
    revenue: number;
    cost: number;
    marginPct: number;
  }>;
}

export function useOrderProfitability(items: LineItem[], shipping: number = 0) {
  const productIds = items.map((i) => i.product_id).filter(Boolean) as string[];

  return useQuery({
    queryKey: ['order-profitability', productIds.sort().join(','), items.map(i => `${i.quantity}:${i.unit_price}:${i.discount}`).join('|'), shipping],
    enabled: items.length > 0 && items.some((i) => i.unit_price > 0),
    staleTime: 30_000,
    queryFn: async (): Promise<OrderProfitability> => {
      let costMap = new Map<string, number>();
      if (productIds.length > 0) {
        const { data } = await supabase
          .from('products')
          .select('id, cost_price')
          .in('id', productIds);
        (data ?? []).forEach((p: any) => costMap.set(p.id, Number(p.cost_price) || 0));
      }

      let gross = 0;
      let discountTotal = 0;
      let cogs = 0;
      const perLine: OrderProfitability['perLine'] = [];

      for (const it of items) {
        const lineGross = it.quantity * it.unit_price;
        const lineNet = lineGross - it.discount;
        const unitCost = it.product_id ? (costMap.get(it.product_id) ?? 0) : 0;
        const lineCost = unitCost * it.quantity;
        gross += lineGross;
        discountTotal += it.discount;
        cogs += lineCost;
        perLine.push({
          product_id: it.product_id,
          product_name: it.product_name,
          revenue: lineNet,
          cost: lineCost,
          marginPct: lineNet > 0 ? ((lineNet - lineCost) / lineNet) * 100 : 0,
        });
      }

      const net = gross - discountTotal + (Number(shipping) || 0);
      const icms = net * DEFAULT_ICMS;
      const pis = net * DEFAULT_PIS;
      const cofins = net * DEFAULT_COFINS;
      const taxTotal = icms + pis + cofins;
      const grossMargin = net - cogs;
      const netMargin = grossMargin - taxTotal;

      return {
        gross,
        discountTotal,
        net,
        cogs,
        taxes: { icms, pis, cofins, total: taxTotal },
        grossMargin,
        netMargin,
        marginPct: net > 0 ? (netMargin / net) * 100 : 0,
        perLine,
      };
    },
  });
}
