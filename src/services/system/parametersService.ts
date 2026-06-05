import { supabase } from '@/integrations/supabase/client';

export const parametersService = {
  async getAll() {
    const { data, error } = await supabase
      .from('system_parameters')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async update(code: string, value: string) {
    const { data, error } = await supabase
      .from('system_parameters')
      .update({ 
        value, 
        updated_at: new Date().toISOString() 
      })
      .eq('code', code)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
