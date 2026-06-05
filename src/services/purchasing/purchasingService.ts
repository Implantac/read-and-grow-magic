import { supabase } from '@/integrations/supabase/client';

export const purchasingService = {
  // Suppliers
  async getSuppliers() {
    const { data, error } = await supabase.from('suppliers').select('*').order('name');
    if (error) throw error;
    return data || [];
  },

  async createSupplier(supplier: any) {
    const { data, error } = await supabase.from('suppliers').insert(supplier).select().single();
    if (error) throw error;
    return data;
  },

  // Purchase Orders
  async getPurchaseOrders() {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*, suppliers(name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createPurchaseOrder(order: any) {
    const { data, error } = await supabase.from('purchase_orders').insert(order).select().single();
    if (error) throw error;
    return data;
  },

  // Quotations
  async getQuotations() {
    const { data, error } = await supabase.from('purchase_quotations').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }
};
