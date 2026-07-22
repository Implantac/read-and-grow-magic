import { useMemo } from 'react';
import type { DbClient } from '@/hooks/commercial/useClients';
import { onlyDigits } from './types';

export function usePDVProductFilter<T extends { name: string; code: string; barcode?: string | null; category_id?: string | null }>(
  products: T[],
  term: string,
  selectedCategoryId: string | null,
) {
  return useMemo(() => {
    let list = products;
    if (selectedCategoryId) list = list.filter((p) => p.category_id === selectedCategoryId);
    if (!term) return list.slice(0, 24);
    return list
      .filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.code.toLowerCase().includes(term) ||
          (p.barcode || '').includes(term),
      )
      .slice(0, 24);
  }, [products, term, selectedCategoryId]);
}

export function usePDVClientFilter(clients: DbClient[], customerQuery: string) {
  return useMemo(() => {
    const q = customerQuery.trim().toLowerCase();
    if (!q) return clients.slice(0, 12);
    const digits = onlyDigits(q);
    return clients
      .filter((c) =>
        c.name.toLowerCase().includes(q) ||
        (digits && onlyDigits(c.document || '').includes(digits)) ||
        (c.email || '').toLowerCase().includes(q),
      )
      .slice(0, 12);
  }, [clients, customerQuery]);
}
