import { supabase } from '@/integrations/supabase/client';
import { BaseService } from '../shared/baseService';

/**
 * Service consolidado para gerenciamento de clientes.
 * Herda operações base (CRUD tipado) e adiciona buscas customizadas.
 * AUD-5: unifica clientService + clientsService.
 */
export class ClientsService extends BaseService<'clients'> {
  constructor() {
    super('clients');
  }

  async getAll() {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return (data || []) as any[];
  }
}

export const clientsService = new ClientsService();
// Backwards-compat alias (será removido após deprecation window).
export const clientService = clientsService;
