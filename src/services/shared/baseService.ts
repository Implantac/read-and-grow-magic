import { supabase } from '@/integrations/supabase/client';

export interface BaseServiceOptions {
  orderBy?: string;
  ascending?: boolean;
}

export class BaseService<T> {
  constructor(protected tableName: string) {}

  async getAll(options: BaseServiceOptions = {}) {
    const { orderBy = 'created_at', ascending = false } = options;
    
    // Check if column exists or use created_at as fallback
    const { data, error } = await supabase
      .from(this.tableName as any)
      .select('*')
      .order(orderBy, { ascending });

    if (error) {
      console.error(`Error fetching from ${this.tableName}:`, error);
      throw error;
    }
    return data as T[];
  }

  async getById(id: string) {
    const { data, error } = await supabase
      .from(this.tableName as any)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching record ${id} from ${this.tableName}:`, error);
      throw error;
    }
    return data as T;
  }

  async create(item: any) {
    const { data, error } = await supabase
      .from(this.tableName as any)
      .insert(item)
      .select()
      .single();

    if (error) {
      console.error(`Error creating record in ${this.tableName}:`, error);
      throw error;
    }
    return data as T;
  }

  async update(id: string, updates: any) {
    // Add updated_at if column might exist, otherwise it will just be ignored by Supabase if it doesn't
    const payload = { ...updates, updated_at: new Date().toISOString() };
    
    const { data, error } = await supabase
      .from(this.tableName as any)
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating record ${id} in ${this.tableName}:`, error);
      throw error;
    }
    return data as T;
  }

  async delete(id: string) {
    const { error } = await supabase
      .from(this.tableName as any)
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting record ${id} from ${this.tableName}:`, error);
      throw error;
    }
  }
}
