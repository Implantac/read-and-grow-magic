import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchasingService } from '@/services/purchasing/purchasingService';
import { toastSuccess, toastError } from '@/lib/toastHelpers';
import type { PurchaseOrder, Quotation, Supplier } from '@/types/purchasing';

export function usePurchasing() {
  const queryClient = useQueryClient();

  const suppliersQuery = useQuery<Supplier[]>({
    queryKey: ['purchasing_suppliers'],
    queryFn: async () => {
      const data = await purchasingService.getSuppliers();
      return (data || []).map((s: any) => ({
        id: s.id, code: s.code, name: s.name, tradeName: s.trade_name,
        document: s.document, documentType: s.document_type, email: s.email || '',
        phone: s.phone || '', cellphone: s.cellphone, status: s.status,
        category: s.category || '', paymentTerms: s.payment_terms || '', deliveryTime: s.delivery_time,
        rating: Number(s.rating), createdAt: s.created_at, updatedAt: s.updated_at,
        address: { street: s.address_street, number: s.address_number, complement: s.address_complement,
          neighborhood: s.address_neighborhood, city: s.address_city, state: s.address_state, zipCode: s.address_zip_code },
      }));
    },
  });

  const ordersQuery = useQuery<PurchaseOrder[]>({
    queryKey: ['purchasing_orders'],
    queryFn: async () => {
      const data = await purchasingService.getPurchaseOrders();
      return (data || []).map((o: any) => ({
        id: o.id, number: o.number, supplierId: o.supplier_id, supplierName: o.suppliers?.name || '',
        date: o.created_at, expectedDelivery: o.delivery_date, 
        items: (o.items || []).map((i: any) => ({
          id: i.id, productId: i.product_id, productName: i.product_name, productCode: i.product_code,
          quantity: i.quantity, receivedQuantity: i.received_quantity || 0,
          unitPrice: i.unit_price, total: i.total_price, unit: i.unit
        })),
        subtotal: o.subtotal, discount: o.discount || 0, shipping: o.shipping_cost || 0,
        taxes: o.tax_amount || 0, total: o.total_amount,
        paymentTerms: o.payment_terms, status: o.status, priority: o.priority,
        buyerId: o.buyer_id, buyerName: '', createdAt: o.created_at, updatedAt: o.updated_at
      })) as PurchaseOrder[];
    },
  });

  const quotationsQuery = useQuery<Quotation[]>({
    queryKey: ['purchasing_quotations'],
    queryFn: async () => {
      const data = await purchasingService.getQuotations();
      return (data || []).map((q: any) => ({
        id: q.id, number: q.number, title: q.title, description: q.description,
        date: q.created_at, deadline: q.deadline, items: q.items || [],
        suppliers: q.suppliers || [], status: q.status, priority: q.priority,
        buyerId: q.buyer_id, buyerName: '', createdAt: q.created_at, updatedAt: q.updated_at
      }));
    },
  });

  const createSupplierMutation = useMutation({
    mutationFn: (supplier: any) => purchasingService.createSupplier(supplier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchasing_suppliers'] });
      toastSuccess('Fornecedor cadastrado com sucesso');
    }
  });

  return {
    suppliers: (suppliersQuery.data || []) as Supplier[],
    suppliersLoading: suppliersQuery.isLoading,
    orders: (ordersQuery.data || []) as PurchaseOrder[],
    ordersLoading: ordersQuery.isLoading,
    quotations: (quotationsQuery.data || []) as Quotation[],
    quotationsLoading: quotationsQuery.isLoading,
    
    createSupplier: createSupplierMutation.mutateAsync,
  };
}
