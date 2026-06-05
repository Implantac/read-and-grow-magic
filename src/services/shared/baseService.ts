import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type PublicSchema = Database['public'];
type TableName = keyof PublicSchema['Tables'];

/**
 * Base Service with generic CRUD operations and strict typing.
 */
export class BaseService<T extends TableName> {
  constructor(protected tableName: T) {}

  async getAll(options: { orderBy?: string; ascending?: boolean } = {}) {
    const { orderBy = 'created_at', ascending = false } = options;
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .order(orderBy as any, { ascending });

    if (error) throw error;
    return (data as any) as PublicSchema['Tables'][T]['Row'][];
  }

  async getById(id: string) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id' as any, id)
      .single();

    if (error) throw error;
    return (data as any) as PublicSchema['Tables'][T]['Row'];
  }

  async create(item: PublicSchema['Tables'][T]['Insert']) {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert(item as any)
      .select()
      .single();

    if (error) throw error;
    return (data as any) as PublicSchema['Tables'][T]['Row'];
  }

  async update(id: string, updates: PublicSchema['Tables'][T]['Update']) {
    const { data, error } = await supabase
      .from(this.tableName)
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq('id' as any, id)
      .select()
      .single();

    if (error) throw error;
    return (data as any) as PublicSchema['Tables'][T]['Row'];
  }

  async delete(id: string) {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id' as any, id);

    if (error) throw error;
  }

}
