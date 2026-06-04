import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export class BaseRepository<T extends keyof Database['public']['Tables']> {
  constructor(protected tableName: T) {}

  async getAll(companyId?: string) {
    let query = supabase.from(this.tableName).select('*') as any;
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    return await query;
  }

  async getById(id: string) {
    return await (supabase.from(this.tableName).select('*') as any).eq('id', id).single();
  }

  async create(data: any) {
    return await (supabase.from(this.tableName).insert(data) as any).select().single();
  }

  async update(id: string, data: any) {
    return await (supabase.from(this.tableName).update(data) as any).eq('id', id).select().single();
  }

  async delete(id: string) {
    return await (supabase.from(this.tableName).delete() as any).eq('id', id);
  }
}
