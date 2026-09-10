import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchasingService } from '@/services/purchasing/purchasingService';
import { toastSuccess, toastError } from '@/lib/toastHelpers';
import type { PurchaseOrder, Quotation, Supplier } from '@/types/purchasing';
import type { PurchaseOrderRow, PurchaseOrderItemRow } from '@/services/purchasing/purchasingService';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';
import { useEnterprise } from '@/core/auth/EnterpriseContext';

export interface NewPurchaseOrderInput {
  supplierId: string;
  supplierName: string;
  expectedDelivery?: string | null;
  priority: string;
  paymentTerms?: string | null;
  notes?: string | null;
  items: {
    productId: string | null;
    productCode: string;
    productName: string;
    unit: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export function usePurchasing() {
  const queryClient = useQueryClient();
  const { currentCompany } = useEnterprise();

  const suppliersQuery = useQuery<Supplier[]>({
    queryKey: ['purchasing_suppliers'],
    queryFn: async () => {
      const data = await purchasingService.getSuppliers();
      return (data || []).map((s: Tables<'suppliers'>) => ({
        id: s.id, code: s.code, name: s.name, tradeName: s.trade_name,
        document: s.document, documentType: s.document_type, email: s.email || '',
        phone: s.phone || '', cellphone: s.cellphone, status: s.status,
        category: s.category || '', paymentTerms: s.payment_terms || '', deliveryTime: s.delivery_time,
        rating: Number(s.rating), createdAt: s.created_at, updatedAt: s.updated_at,
        address: { street: s.address_street, number: s.address_number, complement: s.address_complement,
          neighborhood: s.address_neighborhood, city: s.address_city, state: s.address_state, zipCode: s.address_zip_code },
      })) as Supplier[];
    },
  });

  const ordersQuery = useQuery<PurchaseOrder[]>({
    queryKey: ['purchasing_orders'],
    queryFn: async () => {
      const data = await purchasingService.getPurchaseOrders();
      return (data || []).map((o: PurchaseOrderRow) => ({
        id: o.id, number: o.number, supplierId: o.supplier_id ?? '', supplierName: o.suppliers?.name || o.supplier_name || '',
        date: o.date ?? o.created_at, expectedDelivery: o.expected_delivery ?? '',
        items: (o.purchase_order_items ?? []).map((i: PurchaseOrderItemRow) => ({
          id: i.id, productId: i.product_id ?? '', productName: i.product_name, productCode: i.product_code,
          quantity: Number(i.quantity ?? 0), receivedQuantity: Number(i.received_quantity ?? 0),
          unitPrice: Number(i.unit_price ?? 0), discount: Number(i.discount ?? 0),
          total: Number(i.total ?? 0), unit: i.unit,
        })),
        subtotal: Number(o.subtotal ?? 0), discount: Number(o.discount ?? 0), shipping: Number(o.shipping ?? 0),
        taxes: Number(o.taxes ?? 0), total: Number(o.total ?? 0),
        paymentTerms: o.payment_terms ?? '', status: o.status, priority: o.priority,
        buyerId: o.buyer_id ?? '', buyerName: o.buyer_name ?? '', createdAt: o.created_at, updatedAt: o.updated_at,
      })) as PurchaseOrder[];
    },
  });

  const quotationsQuery = useQuery<Quotation[]>({
    queryKey: ['purchasing_quotations'],
    queryFn: async () => {
      const data = await purchasingService.getQuotations();
      return (data || []).map((q: Tables<'quotations'>) => ({
        id: q.id, number: q.number, title: `Cotação ${q.number}`, description: q.notes ?? undefined,
        date: q.date ?? q.created_at, deadline: q.valid_until, items: [],
        suppliers: [], status: q.status, priority: 'medium',
        buyerId: q.sales_rep_id ?? '', buyerName: q.sales_rep_name ?? '',
        createdAt: q.created_at, updatedAt: q.updated_at,
      })) as Quotation[];
    },
  });


  const createSupplierMutation = useMutation({
    mutationFn: (supplier: TablesInsert<'suppliers'>) => purchasingService.createSupplier(supplier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchasing_suppliers'] });
      toastSuccess('Fornecedor cadastrado com sucesso');
    }
  });

  const createOrderMutation = useMutation({
    mutationFn: async (input: NewPurchaseOrderInput) => {
      const subtotal = input.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
      const order: TablesInsert<'purchase_orders'> = {
        number: `PC-${Date.now().toString().slice(-8)}`,
        supplier_id: input.supplierId || null,
        supplier_name: input.supplierName,
        date: new Date().toISOString().slice(0, 10),
        expected_delivery: input.expectedDelivery || null,
        priority: input.priority,
        payment_terms: input.paymentTerms || null,
        notes: input.notes || null,
        status: 'draft',
        subtotal,
        total: subtotal,
        ...(currentCompany?.id ? { company_id: currentCompany.id } : {}),
      };

      return purchasingService.createPurchaseOrderWithItems(
        order,
        input.items.map((i) => ({
          product_id: i.productId,
          product_code: i.productCode,
          product_name: i.productName,
          unit: i.unit,
          quantity: i.quantity,
          unit_price: i.unitPrice,
          total: i.quantity * i.unitPrice,
        })),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchasing_orders'] });
      toastSuccess('Pedido de compra criado com sucesso');
    },
    onError: (error: unknown) => {
      toastError(error instanceof Error ? error.message : 'Erro ao criar pedido de compra');
    },
  });

  return {
    suppliers: (suppliersQuery.data || []) as Supplier[],
    suppliersLoading: suppliersQuery.isLoading,
    orders: (ordersQuery.data || []) as PurchaseOrder[],
    ordersLoading: ordersQuery.isLoading,
    quotations: (quotationsQuery.data || []) as Quotation[],
    quotationsLoading: quotationsQuery.isLoading,
    
    createSupplier: createSupplierMutation.mutateAsync,
    createOrder: createOrderMutation.mutateAsync,
    creatingOrder: createOrderMutation.isPending,
  };
}
