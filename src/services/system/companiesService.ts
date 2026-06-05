import { supabase } from '@/integrations/supabase/client';
import type { Company, CompanyStatus } from '@/types/administration';

export const companiesService = {
  async getAll(): Promise<Company[]> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name');
    
    if (error) throw error;
    
    const allCompanies = (data || []).map(company => ({
      id: company.id,
      name: company.name,
      tradeName: company.trade_name,
      cnpj: company.cnpj,
      stateRegistration: company.state_registration,
      municipalRegistration: company.municipal_registration,
      email: company.email,
      phone: company.phone,
      address: {
        street: company.address_street || '',
        number: company.address_number || '',
        complement: company.address_complement || '',
        neighborhood: company.address_neighborhood || '',
        city: company.address_city || '',
        state: company.address_state || '',
        zipCode: company.address_zip_code || '',
        country: 'Brasil'
      },
      logo: company.settings && typeof company.settings === 'object' && 'logo_url' in company.settings ? (company.settings as any).logo_url : undefined,
      status: company.status as CompanyStatus,
      isHeadquarters: company.is_headquarters,
      parentCompanyId: company.parent_company_id,
      createdAt: company.created_at,
      updatedAt: company.updated_at,
      branches: [] as any[],
    }));

    // Build hierarchy: root companies get their sub-companies as branches
    const rootCompanies = allCompanies.filter(c => !c.parentCompanyId || c.isHeadquarters);
    
    rootCompanies.forEach(root => {
      root.branches = allCompanies.filter(c => c.parentCompanyId === root.id);
      // If no sub-companies, add itself as a "Matriz" branch to ensure dropdown works
      if (root.branches.length === 0) {
        root.branches = [{
          id: root.id,
          name: 'Matriz',
          code: '001',
          companyId: root.id
        }];
      }
    });

    return rootCompanies as any;
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
        address_street: company.address.street,
        address_number: company.address.number,
        address_complement: company.address.complement,
        address_neighborhood: company.address.neighborhood,
        address_city: company.address.city,
        address_state: company.address.state,
        address_zip_code: company.address.zipCode,
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
    if (company.address) {
      updateData.address_street = company.address.street;
      updateData.address_number = company.address.number;
      updateData.address_complement = company.address.complement;
      updateData.address_neighborhood = company.address.neighborhood;
      updateData.address_city = company.address.city;
      updateData.address_state = company.address.state;
      updateData.address_zip_code = company.address.zipCode;
    }
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
