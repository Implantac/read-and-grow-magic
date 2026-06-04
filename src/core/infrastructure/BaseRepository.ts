import { supabase } from "@/integrations/supabase/client";

export class BaseRepository<T> {
  constructor(protected tableName: string) {}

  async getAll(companyId?: string) {
    let query = supabase.from(this.tableName).select('*');
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    return await query;
  }

  async getById(id: string) {
    return await supabase.from(this.tableName).select('*').eq('id', id).single();
  }

  async create(data: Partial<T>) {
    return await supabase.from(this.tableName).insert(data).select().single();
  }

  async update(id: string, data: Partial<T>) {
    return await supabase.from(this.tableName).update(data).eq('id', id).select().single();
  }

  async delete(id: string) {
    return await supabase.from(this.tableName).delete().eq('id', id);
  }
}
