import { useMemo } from 'react';
import type { OrderLike, SaleLike, ProductLike, ProductSuggestion } from './types';

export function useProductSuggestions(clientId: string | null, orders: OrderLike[], sales: SaleLike[], products: ProductLike[]) {
  return useMemo(() => {
    if (!clientId || products.length === 0) return [];

    const purchasedProductIds = new Set<string>();
    const purchasedCategories = new Set<string>();
    const itemFrequency: Record<string, number> = {};

    const clientOrders = orders.filter((o) => o.client_id === clientId && o.status !== 'cancelled');
    const clientSales = sales.filter((s) => s.client_id === clientId && s.status !== 'cancelled');

    [...clientOrders, ...clientSales].forEach((o) => {
      (o.items || []).forEach((item) => {
        if (item.product_id) {
          purchasedProductIds.add(item.product_id);
          itemFrequency[item.product_id] = (itemFrequency[item.product_id] || 0) + 1;
        }
      });
    });

    products.forEach(p => {
      if (purchasedProductIds.has(p.id) && p.category_id) {
        purchasedCategories.add(p.category_id);
      }
    });

    const suggestions: ProductSuggestion[] = [];

    products.forEach(p => {
      if (purchasedProductIds.has(p.id) || p.status !== 'active') return;

      if (p.category_id && purchasedCategories.has(p.category_id)) {
        suggestions.push({
          productId: p.id,
          productName: p.name,
          productCode: p.code,
          reason: 'Mesmo segmento de produtos que o cliente já compra',
          estimatedValue: p.sale_price,
          confidence: 'high',
        });
      }
    });

    const avgPrice = products.filter(p => purchasedProductIds.has(p.id))
      .reduce((s, p) => s + p.sale_price, 0) / Math.max(purchasedProductIds.size, 1);

    products.forEach(p => {
      if (purchasedProductIds.has(p.id) || p.status !== 'active') return;
      if (suggestions.find(s => s.productId === p.id)) return;

      const margin = p.cost_price > 0 ? ((p.sale_price - p.cost_price) / p.sale_price) * 100 : 0;
      if (margin > 40 && p.sale_price > avgPrice) {
        suggestions.push({
          productId: p.id,
          productName: p.name,
          productCode: p.code,
          reason: `Alta margem (${margin.toFixed(0)}%) — produto premium`,
          estimatedValue: p.sale_price,
          confidence: 'medium',
        });
      }
    });

    return suggestions.slice(0, 10);
  }, [clientId, orders, sales, products]);
}
