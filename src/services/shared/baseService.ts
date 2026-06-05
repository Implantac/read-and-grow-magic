import { supabase } from '@/integrations/supabase/client';

/**
 * Base Service with generic CRUD operations.
 */
export class BaseService<T extends string> {
  constructor(protected tableName: T) {}

  async getAll(options: { 
    orderBy?: string; 
    ascending?: boolean;
    limit?: number;
    filters?: Record<string, any>;
  } = {}) {
    const { orderBy = 'created_at', ascending = false, limit, filters } = options;
    
    let query = supabase
      .from(this.tableName as any)
      .select('*');

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key as any, value);
        }
      });
    }

    query = query.order(orderBy as any, { ascending });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as any[];
  }

  async getById(id: string) {
    const { data, error } = await supabase
      .from(this.tableName as any)
      .select('*')
      .eq('id' as any, id)
      .maybeSingle();

    if (error) throw error;
    return data as any;
  }

  async create(item: any) {
    const { data, error } = await supabase
      .from(this.tableName as any)
      .insert(item as any)
      .select()
      .single();

    if (error) throw error;
    return data as any;
  }

  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from(this.tableName as any)
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq('id' as any, id)
      .select()
      .single();

    if (error) throw error;
    return data as any;
  }

  async delete(id: string) {
    const { error } = await supabase
      .from(this.tableName as any)
      .delete()
      .eq('id' as any, id);

    if (error) throw error;
  }
}


