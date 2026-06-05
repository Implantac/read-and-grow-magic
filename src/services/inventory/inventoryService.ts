import { supabase } from '@/integrations/supabase/client';

export const inventoryService = {
  // Products
  async getProducts() {
    const { data, error } = await supabase
      .from('products' as any)
      .select('*, categories(name)')
      .order('name');
    if (error) throw error;
    return (data || []).map((p: any) => ({
      ...p,
      categoryName: p.categories?.name || ''
    }));
  },

  async createProduct(product: any) {
    const { data, error } = await supabase.from('products' as any).insert(product).select().single();
    if (error) throw error;
    return data;
  },

  async updateProduct(id: string, updates: any) {
    const { data, error } = await supabase.from('products' as any).update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteProduct(id: string) {
    const { error } = await supabase.from('products' as any).delete().eq('id', id);
    if (error) throw error;
  },

  // Categories
  async getCategories() {
    const { data, error } = await supabase.from('categories' as any).select('*').order('name');
    if (error) throw error;
    return data || [];
  },

  // Movements
  async getMovements() {
    const { data, error } = await supabase
      .from('inventory_movements' as any)
      .select('*, products(name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }
};
