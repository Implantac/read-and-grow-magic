import { useQueryClient } from '@tanstack/react-query';
import { productsService } from '@/services/inventory/productsService';
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/shared/useSupabaseQuery';
import { mutationErrorHandler, toastSuccess } from '@/lib/toastHelpers';
import { useEnterprise } from '@/core/auth/EnterpriseContext';

export type ProductNature = 'industry' | 'commerce' | 'service';

export interface DbProduct {
  id: string;
  code: string;
  barcode: string | null;
  name: string;
  description: string | null;
  type: string;
  product_nature: ProductNature;
  category_id: string | null;
  subcategory: string | null;
  unit: string;
  weight: number | null;
  width: number | null;
  height: number | null;
  depth: number | null;
  cost_price: number;
  sale_price: number;
  min_stock: number;
  max_stock: number;
  reorder_point: number;
  lead_time_days: number;
  supplier: string | null;
  location: string | null;
  status: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  category_name?: string;
  // Fiscais
  ncm: string | null;
  cest: string | null;
  cfop_default: string | null;
  origin: string | null;
  icms_cst: string | null;
  ipi_cst: string | null;
  pis_cst: string | null;
  cofins_cst: string | null;
  gtin: string | null;
  // Indústria
  production_route_id: string | null;
  bom_id: string | null;
  standard_batch_size: number | null;
  technical_sheet_url: string | null;
  // Comércio
  brand: string | null;
  model: string | null;
  warranty_months: number | null;
  // Serviços
  service_code_lc116: string | null;
  iss_rate: number | null;
  service_duration_minutes: number | null;
  is_recurring: boolean | null;
}

export function useProducts() {
  return useSupabaseQuery(['products'], () => productsService.getAll());
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { currentCompany } = useEnterprise();
  return useSupabaseMutation(
    (product: Partial<DbProduct>) =>
      productsService.create({ ...product, company_id: currentCompany?.id }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['products'] });
        toastSuccess('Produto criado com sucesso!');
      },
      onError: mutationErrorHandler('Erro ao criar produto'),
    }
  );
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useSupabaseMutation(
    ({ id, category_name, ...product }: Partial<DbProduct> & { id: string; category_name?: string }) =>
      productsService.update(id, product),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['products'] });
        toastSuccess('Produto atualizado com sucesso!');
      },
      onError: mutationErrorHandler('Erro ao atualizar produto'),
    }
  );
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useSupabaseMutation(
    (id: string) => productsService.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['products'] });
        toastSuccess('Produto excluído com sucesso!');
      },
      onError: mutationErrorHandler('Erro ao excluir produto'),
    }
  );
}
