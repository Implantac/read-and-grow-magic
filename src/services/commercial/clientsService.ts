import { supabase } from '@/integrations/supabase/client';
import { DbClient } from '@/hooks/commercial/useClients';

export const clientsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return (data || []) as DbClient[];
  },

  async create(client: Omit<DbClient, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase.from('clients').insert(client as any).select().single();
    if (error) throw error;
    return data;
  },

  async update(id: string, client: Partial<DbClient>) {
    const { data, error } = await supabase
      .from('clients')
      .update({ ...client, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw error;
  }
};
