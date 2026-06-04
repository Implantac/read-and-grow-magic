import { supabase } from '@/integrations/supabase/client';

/**
 * Service base com operações CRUD genéricas.
 */
export class BaseService<T extends { id: string }> {
  constructor(protected tableName: string) {}

  async getAll(options: { orderBy?: string; ascending?: boolean } = {}) {
    const { orderBy = 'created_at', ascending = false } = options;
    const { data, error } = await supabase
      .from(this.tableName as any)
      .select('*')
      .order(orderBy, { ascending });

    if (error) throw error;
    return data as T[];
  }

  async getById(id: string) {
    const { data, error } = await supabase
      .from(this.tableName as any)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as T;
  }

  async create(item: Omit<T, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from(this.tableName as any)
      .insert(item as any)
      .select()
      .single();

    if (error) throw error;
    return data as T;
  }

  async update(id: string, updates: Partial<T>) {
    const { data, error } = await supabase
      .from(this.tableName as any)
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as T;
  }

  async delete(id: string) {
    const { error } = await supabase
      .from(this.tableName as any)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
