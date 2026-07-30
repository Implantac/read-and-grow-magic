import { supabase } from '@/integrations/supabase/client';

export const inventoryService = {
  // Products
  async getProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .order('name');
    if (error) throw error;
    return (data || []).map((p: any) => ({
      ...p,
      categoryName: p.categories?.name || ''
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
    // Tabela real é `stock_movements` (inventory_movements não existe → causava 404 no PostgREST).
    const { data, error } = await supabase
      .from('stock_movements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    return data || [];
  }
};
