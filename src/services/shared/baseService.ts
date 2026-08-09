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
 * O nome da tabela é dinâmico (genérico `T`), o que impede o supabase-js de
 * inferir o builder correto. Isolamos o único cast necessário aqui, com uma
 * superfície mínima e explícita, em vez de espalhar `as any` pelos métodos.
 * intentional: tabela resolvida em runtime.
 */
type DynamicQuery = {
  select: (cols?: string) => DynamicQuery;
  insert: (values: unknown) => DynamicQuery;
  update: (values: unknown) => DynamicQuery;
  delete: () => DynamicQuery;
  eq: (col: string, value: unknown) => DynamicQuery;
  order: (col: string, opts: { ascending: boolean }) => DynamicQuery;
  limit: (n: number) => DynamicQuery;
  single: () => Promise<{ data: unknown; error: unknown }>;
  maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
  then: Promise<{ data: unknown; error: unknown }>['then'];
};

const dynamicTable = (table: TableName): DynamicQuery =>
  supabase.from(table) as unknown as DynamicQuery;

/**
 * Base Service with generic CRUD operations, typed by table name.
 */
export class BaseService<T extends TableName> {
  constructor(protected tableName: T) {}

  async getAll(options: GetAllOptions = {}): Promise<RowOf<T>[]> {
    const { orderBy = 'created_at', ascending = false, limit = 1000, filters } = options;

    let query = dynamicTable(this.tableName).select('*');

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }

    query = query.order(orderBy, { ascending });
    if (limit) query = query.limit(limit);

    const { data, error } = (await query) as {
      data: RowOf<T>[] | null;
      error: unknown;
    };
    if (error) throw error;
    return (data || []) as RowOf<T>[];
  }

  async getById(id: string): Promise<RowOf<T> | null> {
    const { data, error } = await dynamicTable(this.tableName)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return (data ?? null) as RowOf<T> | null;
  }

  async create(item: InsertOf<T>): Promise<RowOf<T>> {
    const { data, error } = await dynamicTable(this.tableName)
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    return data as RowOf<T>;
  }

  async update(id: string, updates: UpdateOf<T>): Promise<RowOf<T>> {
    const payload = { ...updates, updated_at: new Date().toISOString() };
    const { data, error } = await dynamicTable(this.tableName)
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as RowOf<T>;
  }

  async delete(id: string): Promise<void> {
    const { error } = await dynamicTable(this.tableName)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
