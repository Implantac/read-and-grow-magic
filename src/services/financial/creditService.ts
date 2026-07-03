import { supabase } from '@/integrations/supabase/client';

/**
 * Serviço de análise de crédito.
 * NOTA: A tabela `credit_analyses` não existe no schema — os dados de crédito
 * ficam em `customer_credit_profiles`. Mantido este stub para não quebrar
 * consumidores; retorna lista vazia até o modelo ser adaptado.
 */
export const creditService = {
  async getCreditAnalyses() {
    const { data, error } = await supabase
      .from('customer_credit_profiles')
      .select('*, clients(name)')
      .order('updated_at', { ascending: false });
    if (error) {
      console.error('[creditService.getCreditAnalyses]', error);
      return [];
    }
    return data || [];
  },

  async getOrderBlocks() {
    // order_blocks referencia orders (não clients diretamente).
    const { data, error } = await supabase
      .from('order_blocks')
      .select('*, orders(number, client_name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async updateAnalysis(id: string, updates: any) {
    const { data, error } = await supabase
      .from('customer_credit_profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
