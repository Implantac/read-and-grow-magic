import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ProductionOrderRow } from '@/hooks/production/useProductionOrders';

export function useProductCosts(orders: ProductionOrderRow[]) {
  const [productCosts, setProductCosts] = useState<Record<string, number>>({});

  useEffect(() => {
    const productIds = [...new Set(orders.map(o => o.product_id).filter(Boolean))];
    if (productIds.length === 0) return;
    (async () => {
      const { data } = await supabase.from('products').select('id, cost_price').in('id', productIds as string[]);
      if (data) {
        const map: Record<string, number> = {};
        data.forEach((p: any) => { map[p.id] = Number(p.cost_price) || 0; });
        setProductCosts(map);
      }
    })();
  }, [orders]);

  return productCosts;
}
