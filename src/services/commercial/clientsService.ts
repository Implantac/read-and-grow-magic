import { supabase } from '@/integrations/supabase/client';
import { DbClient } from '@/hooks/commercial/useClients';
import { BaseService } from '../shared/baseService';

class ClientsService extends BaseService<DbClient> {
  constructor() {
    super('clients');
  }

  async getAll() {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return (data || []) as DbClient[];
  }
}

export const clientsService = new ClientsService();
