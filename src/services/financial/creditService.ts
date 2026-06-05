import { supabase } from '@/integrations/supabase/client';

export const creditService = {
  async getCreditAnalyses() {
    const { data, error } = await supabase
      .from('credit_analyses' as any)
      .select('*, clients(name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getOrderBlocks() {
    const { data, error } = await supabase
      .from('order_blocks' as any)
      .select('*, clients(name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async updateAnalysis(id: string, updates: any) {
    const { data, error } = await supabase.from('credit_analyses' as any).update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }
};
