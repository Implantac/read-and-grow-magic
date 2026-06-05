import { supabase } from '@/integrations/supabase/client';
import { DbProduct } from '@/hooks/inventory/useProducts';

/**
 * Service para produtos com suporte a categorias.
 */
export const productsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as any[]).map((p) => ({
      ...p,
      category_name: p.categories?.name || '',
    })) as DbProduct[];
  },

  async create(product: Omit<DbProduct, 'id' | 'created_at' | 'updated_at' | 'category_name'>) {
    const { data, error } = await supabase.from('products').insert(product as any).select().single();
    if (error) throw error;
    return data;
  },

  async update(id: string, product: Partial<DbProduct>) {
    const { data, error } = await supabase
      .from('products')
      .update({ ...product, updated_at: new Date().toISOString() } as any)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  }
};
