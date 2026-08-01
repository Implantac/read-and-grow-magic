import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type PurchaseOrderItemRow = Tables<'purchase_order_items'>;

export type PurchaseOrderRow = Tables<'purchase_orders'> & {
  suppliers: { name: string | null } | null;
  purchase_order_items: PurchaseOrderItemRow[] | null;
};

export const purchasingService = {
  // Suppliers
  async getSuppliers(): Promise<Tables<'suppliers'>[]> {
    const { data, error } = await supabase.from('suppliers').select('*').order('name');
    if (error) throw error;
    return data || [];
  },

  async createSupplier(supplier: TablesInsert<'suppliers'>) {
    const { data, error } = await supabase.from('suppliers').insert(supplier).select().single();
    if (error) throw error;
    return data;
  },

  // Purchase Orders
  async getPurchaseOrders(): Promise<PurchaseOrderRow[]> {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*, suppliers(name), purchase_order_items(*)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as PurchaseOrderRow[];
  },

  async createPurchaseOrder(order: TablesInsert<'purchase_orders'>) {
    const { data, error } = await supabase.from('purchase_orders').insert(order).select().single();
    if (error) throw error;
    return data;
  },

  // Quotations — tabela real é `quotations` (não `purchase_quotations`).
  async getQuotations(): Promise<Tables<'quotations'>[]> {
    const { data, error } = await supabase
      .from('quotations')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }
};
