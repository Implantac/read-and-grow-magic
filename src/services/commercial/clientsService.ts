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

  async create(
    client: Omit<TablesInsert<'clients'>, 'company_id'> & { company_id?: string },
  ) {
    const company_id = client.company_id ?? (await this.resolveCompanyId());
    return this.base.create({ ...client, company_id });
  }

  private async resolveCompanyId(): Promise<string> {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) throw new Error('Sessão expirada');
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userId)
      .maybeSingle();
    if (!profile?.company_id) throw new Error('Empresa não encontrada');
    return profile.company_id;
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
