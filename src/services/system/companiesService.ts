import { supabase } from '@/integrations/supabase/client';
import type { Company } from '@/types/administration';

export const companiesService = {
  async getAll(): Promise<Company[]> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name');
    
    if (error) throw error;
    
    return (data || []).map(company => ({
      id: company.id,
      name: company.name,
      tradeName: company.trade_name,
      cnpj: company.cnpj,
      stateRegistration: company.state_registration,
      municipalRegistration: company.municipal_registration,
      email: company.email,
      phone: company.phone,
      address: company.address as any,
      logo: company.logo,
      status: company.status,
      isHeadquarters: company.is_headquarters,
      parentCompanyId: company.parent_company_id,
      createdAt: company.created_at,
      updatedAt: company.updated_at,
    }));
  },

  async create(company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) {
    const { data, error } = await supabase
      .from('companies')
      .insert([{
        name: company.name,
        trade_name: company.tradeName,
        cnpj: company.cnpj,
        email: company.email,
        phone: company.phone,
        address: company.address,
        status: company.status,
        is_headquarters: company.isHeadquarters,
        parent_company_id: company.parentCompanyId
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, company: Partial<Company>) {
    const updateData: any = {};
    if (company.name) updateData.name = company.name;
    if (company.tradeName) updateData.trade_name = company.tradeName;
    if (company.cnpj) updateData.cnpj = company.cnpj;
    if (company.email) updateData.email = company.email;
    if (company.phone) updateData.phone = company.phone;
    if (company.address) updateData.address = company.address;
    if (company.status) updateData.status = company.status;
    
    const { data, error } = await supabase
      .from('companies')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};
