import { supabase } from '@/integrations/supabase/client';
import { BaseService } from '../shared/baseService';

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
    return (data || []) as any[];
  }

  async create(client: any) {
    return this.base.create(client);
  }

  async update(id: string, client: any) {
    return this.base.update(id, client);
  }

  async delete(id: string) {
    return this.base.delete(id);
  }
}

export const clientsService = new ClientsService();
// Backwards-compat alias (deprecated — usar clientsService).
export const clientService = clientsService;
