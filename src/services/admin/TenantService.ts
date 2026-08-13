import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type CompanyRow = Database['public']['Tables']['companies']['Row'];

export class TenantService {
  static async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('default_branch_id, company_id, name')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  static async getUserRole(userId: string) {
    const { data, error } = await supabase.rpc('get_user_role', { _user_id: userId });
    if (error) throw error;
    return data;
  }

  static async getCompanies() {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .limit(10); // Pequeno limite para segurança
    
    if (error) throw error;
    return data;
  }

  static async getOperationalUnits(companyId: string) {
    const { data, error } = await supabase
      .from('operational_units' as any)
      .select('id, name, type, is_active')
      .eq('company_id', companyId);
    
    if (error) throw error;
    return data;
  }
}
