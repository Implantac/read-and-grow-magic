import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEnterpriseStore } from '@/core/stores/useEnterpriseStore';
import { useCanalStore } from '@/stores/useCanalStore';

export interface EstoqueMatrixRow {
  product_id: string;
  product_code: string | null;
  product_name: string | null;
  branch_id: string | null;
  branch_name: string | null;
  branch_tipo: string | null;
  canal_operacional: 'VAREJO_PDV' | 'ATACADO_INDUSTRIA';
  quantity: number;
  min_stock: number;
}

/**
 * Global stock matrix (product × branch × canal).
 * The manager consumes this to compare Industry stock vs each retail store.
 */
export function useEstoqueMatrix(search = '') {
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);
  const { canal, branchId } = useCanalStore();

  return useQuery({
    queryKey: ['estoque-matrix', companyId, canal, branchId, search],
    enabled: !!companyId,
    staleTime: 30 * 1000,
    queryFn: async () => {
      let query = supabase
        .from('stock_balances')
        .select(
          'product_id, product_code, product_name, branch_id, canal_operacional, quantity, branches(name, tipo)'
        )
        .eq('company_id', companyId!)
        .limit(2000);

      if (canal !== 'CONSOLIDADO') query = query.eq('canal_operacional', canal);
      if (branchId) query = query.eq('branch_id', branchId);
      if (search) query = query.ilike('product_name', `%${search}%`);

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map((r: any) => ({
        product_id: r.product_id,
        product_code: r.product_code,
        product_name: r.product_name,
        branch_id: r.branch_id,
        branch_name: r.branches?.name ?? '—',
        branch_tipo: r.branches?.tipo ?? null,
        canal_operacional: r.canal_operacional,
        quantity: Number(r.quantity ?? 0),
      })) as EstoqueMatrixRow[];
    },
  });
}
