import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEnterpriseStore } from '@/core/stores/useEnterpriseStore';

export interface AuditRow {
  id: string;
  created_at: string;
  direction: 'in' | 'out' | string;
  quantity: number;
  type: string | null;
  document_number: string | null;
  reference: string | null;
  notes: string | null;
  operator: string | null;
  source: string | null;
  branch_id: string | null;
  canal_operacional: 'VAREJO_PDV' | 'ATACADO_INDUSTRIA' | null;
  unit_cost: number | null;
  total_cost: number | null;
  from_warehouse: string | null;
  to_warehouse: string | null;
  running_balance?: number;
}

export interface AuditFilters {
  productId: string;
  branchId?: string | null;
  canal?: 'VAREJO_PDV' | 'ATACADO_INDUSTRIA' | null;
  direction?: 'in' | 'out' | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}

export function useStockAudit(f: AuditFilters) {
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);
  return useQuery({
    queryKey: ['stock-audit', companyId, f],
    enabled: !!companyId && !!f.productId,
    staleTime: 15 * 1000,
    queryFn: async () => {
      let q = supabase
        .from('stock_movements')
        .select(
          'id, created_at, direction, quantity, type, document_number, reference, notes, operator, source, branch_id, canal_operacional, unit_cost, total_cost, from_warehouse, to_warehouse'
        )
        .eq('company_id', companyId!)
        .eq('product_id', f.productId)
        .order('created_at', { ascending: true })
        .limit(2000);
      if (f.branchId) q = q.eq('branch_id', f.branchId);
      if (f.canal) q = q.eq('canal_operacional', f.canal);
      if (f.direction) q = q.eq('direction', f.direction);
      if (f.dateFrom) q = q.gte('created_at', f.dateFrom);
      if (f.dateTo) q = q.lte('created_at', f.dateTo);

      const { data, error } = await q;
      if (error) throw error;

      let bal = 0;
      const rows = (data ?? []).map((r: any) => {
        const qty = Number(r.quantity ?? 0);
        bal += r.direction === 'in' ? qty : -qty;
        return { ...r, quantity: qty, running_balance: bal } as AuditRow;
      });
      // exibir do mais recente para o mais antigo mantendo saldo já calculado
      return rows.reverse();
    },
  });
}

export function useProductSearch(term: string) {
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);
  return useQuery({
    queryKey: ['product-search-audit', companyId, term],
    enabled: !!companyId,
    staleTime: 60 * 1000,
    queryFn: async () => {
      let q = supabase
        .from('products')
        .select('id, code, name')
        .eq('company_id', companyId!)
        .order('name')
        .limit(30);
      if (term.trim()) q = q.or(`name.ilike.%${term}%,code.ilike.%${term}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as { id: string; code: string | null; name: string }[];
    },
  });
}
