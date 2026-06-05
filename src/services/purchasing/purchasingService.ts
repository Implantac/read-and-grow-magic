import { supabase } from '@/integrations/supabase/client';

export const purchasingService = {
  // Suppliers
  async getSuppliers() {
    const { data, error } = await supabase.from('suppliers' as any).select('*').order('name');
    if (error) throw error;
    return data || [];
  },

  async createSupplier(supplier: any) {
    const { data, error } = await supabase.from('suppliers' as any).insert(supplier).select().single();
    if (error) throw error;
    return data;
  },

  // Purchase Orders
  async getPurchaseOrders() {
    const { data, error } = await supabase
      .from('purchase_orders' as any)
      .select('*, suppliers(name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createPurchaseOrder(order: any) {
    const { data, error } = await supabase.from('purchase_orders' as any).insert(order).select().single();
    if (error) throw error;
    return data;
  },

  // Quotations
  async getQuotations() {
    const { data, error } = await (supabase.from('purchase_quotations' as any)
      .select('*') as any)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }
};
