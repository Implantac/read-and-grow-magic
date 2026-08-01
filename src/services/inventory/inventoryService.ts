import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type ProductWithCategory = Tables<'products'> & { categoryName: string };

export const inventoryService = {
  // Products
  async getProducts(): Promise<ProductWithCategory[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .order('name');
    if (error) throw error;
    const rows = (data ?? []) as unknown as (Tables<'products'> & { categories: { name: string | null } | null })[];
    return rows.map((p) => ({
      ...p,
      categoryName: p.categories?.name || '',
    }));
  },

  async createProduct(product: TablesInsert<'products'>) {
    const { data, error } = await supabase.from('products').insert(product).select().single();
    if (error) throw error;
    return data;
  },

  async updateProduct(id: string, updates: TablesUpdate<'products'>) {
    const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteProduct(id: string) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  },

  // Categories
  async getCategories(): Promise<Tables<'categories'>[]> {
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (error) throw error;
    return data || [];
  },

  // Movements
  async getMovements(): Promise<Tables<'stock_movements'>[]> {
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
