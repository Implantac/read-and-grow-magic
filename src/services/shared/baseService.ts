import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type TableName = keyof Database['public']['Tables'];
type RowOf<T extends TableName> = Database['public']['Tables'][T]['Row'];
type InsertOf<T extends TableName> = Database['public']['Tables'][T]['Insert'];
type UpdateOf<T extends TableName> = Database['public']['Tables'][T]['Update'];

interface GetAllOptions {
  orderBy?: string;
  ascending?: boolean;
  limit?: number;
  filters?: Record<string, string | number | boolean | null>;
}

/**
 * Base Service with generic CRUD operations, typed by table name.
 */
export class BaseService<T extends TableName> {
  constructor(protected tableName: T) {}

  async getAll(options: GetAllOptions = {}): Promise<RowOf<T>[]> {
    const { orderBy = 'created_at', ascending = false, limit, filters } = options;

    // The dynamic table name requires a controlled cast on the builder itself.
    let query = (supabase.from(this.tableName) as unknown as {
      select: (cols: string) => any;
    }).select('*');

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }

    query = query.order(orderBy, { ascending });
    if (limit) query = query.limit(limit);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as RowOf<T>[];
  }

  async getById(id: string): Promise<RowOf<T> | null> {
    const { data, error } = await (supabase.from(this.tableName) as any)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return (data ?? null) as RowOf<T> | null;
  }

  async create(item: InsertOf<T>): Promise<RowOf<T>> {
    const { data, error } = await (supabase.from(this.tableName) as any)
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    return data as RowOf<T>;
  }

  async update(id: string, updates: UpdateOf<T>): Promise<RowOf<T>> {
    const payload = { ...updates, updated_at: new Date().toISOString() };
    const { data, error } = await (supabase.from(this.tableName) as any)
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as RowOf<T>;
  }

  async delete(id: string): Promise<void> {
    const { error } = await (supabase.from(this.tableName) as any)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
