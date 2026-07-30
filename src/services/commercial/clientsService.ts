import { supabase } from '@/integrations/supabase/client';
import { BaseService } from '../shared/baseService';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

/**
 * Service consolidado para gerenciamento de clientes.
 * AUD-5: unifica clientService + clientsService.
 */
class ClientsService {
  private base = new BaseService('clients');

  async getAll() {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return (data || []) as Tables<'clients'>[];
  }

  async create(client: TablesInsert<'clients'>) {
    return this.base.create(client);
  }

  async update(id: string, client: TablesUpdate<'clients'>) {
    return this.base.update(id, client);
  }

  async delete(id: string) {
    return this.base.delete(id);
  }
}

export const clientsService = new ClientsService();
// Backwards-compat alias (deprecated — usar clientsService).
export const clientService = clientsService;
