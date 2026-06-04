import { supabase } from '@/integrations/supabase/client';
import { DbClient } from '@/hooks/commercial/useClients';
import { BaseService } from '../shared/baseService';

class ClientsService {
  private base = new BaseService<DbClient>('clients');

  async getAll() {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return (data || []) as DbClient[];
  }

  async create(client: Omit<DbClient, 'id' | 'created_at' | 'updated_at'>) {
    return this.base.create(client);
  }

  async update(id: string, client: Partial<DbClient>) {
    return this.base.update(id, client);
  }

  async delete(id: string) {
    return this.base.delete(id);
  }
}

export const clientsService = new ClientsService();
