import { supabase } from '@/integrations/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';

export interface BaseServiceOptions {
  orderBy?: string;
  ascending?: boolean;
}

export class BaseService<T extends { id: string }> {
  constructor(protected tableName: string) {}

  async getAll(options: BaseServiceOptions = {}) {
    const { orderBy = 'created_at', ascending = false } = options;
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .order(orderBy, { ascending });

    if (error) throw error;
    return data as T[];
  }

  async getById(id: string) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as T;
  }

  async create(item: Omit<T, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert(item as any)
      .select()
      .single();

    if (error) throw error;
    return data as T;
  }

  async update(id: string, updates: Partial<T>) {
    const { data, error } = await supabase
      .from(this.tableName)
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as T;
  }

  async delete(id: string) {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
