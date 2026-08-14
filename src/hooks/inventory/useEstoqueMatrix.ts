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
  reserved_quantity?: number;
  in_transit_in_quantity?: number;
  average_daily_sales?: number;
  abc_class?: string;
  min_stock: number;
  max_stock?: number;
  lead_time_days?: number;
}

/**
 * Global stock matrix (product × branch × canal).
 * The manager consumes this to compare Industry stock vs each retail store.
 */
export function useEstoqueMatrix(search = '', forceConsolidated = false) {
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);
  const { canal, branchId } = useCanalStore();

  return useQuery({
    queryKey: ['estoque-matrix', companyId, canal, branchId, search, forceConsolidated],
    enabled: !!companyId,
    staleTime: 30 * 1000,
    queryFn: async () => {
      let query = supabase
        .from('stock_balances')
        .select(
          'product_id, product_code, product_name, branch_id, canal_operacional, quantity, reserved_quantity, in_transit_in_quantity, average_daily_sales, abc_class, branches(name, tipo), products(min_stock, max_stock, lead_time_days)'
        )
        .eq('company_id', companyId!)
        .limit(2000);

      if (!forceConsolidated) {
        if (canal !== 'CONSOLIDADO') query = query.eq('canal_operacional', canal);
        if (branchId) query = query.eq('branch_id', branchId);
      }
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
        reserved_quantity: Number(r.reserved_quantity ?? 0),
        in_transit_in_quantity: Number(r.in_transit_in_quantity ?? 0),
        average_daily_sales: Number(r.average_daily_sales ?? 0),
        abc_class: r.abc_class,
        min_stock: Number(r.products?.min_stock ?? 0),
        max_stock: Number(r.products?.max_stock ?? 0),
        lead_time_days: Number(r.products?.lead_time_days ?? 0),
      })) as EstoqueMatrixRow[];
    },
  });
}
