import { supabase } from '@/integrations/supabase/client';

export const inventoryService = {
  // Products
  async getProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .order('name');
    if (error) throw error;
    return (data || []).map(p => ({
      ...p,
      categoryName: (p as any).categories?.name || ''
    }));
  },

  async createProduct(product: any) {
    const { data, error } = await supabase.from('products').insert(product).select().single();
    if (error) throw error;
    return data;
  },

  async updateProduct(id: string, updates: any) {
    const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteProduct(id: string) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  },

  // Categories
  async getCategories() {
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (error) throw error;
    return data || [];
  },

  // Movements
  async getMovements() {
    const { data, error } = await supabase
      .from('inventory_movements')
      .select('*, products(name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }
};
