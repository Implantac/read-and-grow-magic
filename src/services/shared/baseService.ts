import { supabase } from '@/integrations/supabase/client';

export interface BaseServiceOptions {
  orderBy?: string;
  ascending?: boolean;
}

export class BaseService<T> {
  constructor(protected tableName: string) {}

  async getAll(options: BaseServiceOptions = {}) {
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

  async create(item: any) {
    const { data, error } = await supabase
      .from(this.tableName as any)
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    return data as T;
  }

  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from(this.tableName as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
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
