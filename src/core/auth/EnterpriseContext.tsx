import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type Segment = 'textile' | 'food_factory' | 'pharma' | 'distribution' | 'services' | 'retail' | 'general' | 'fio' | 'tecelagem' | 'animal_feed' | 'industry' | 'wholesaler' | 'retail_chain' | 'franchise' | 'holding' | 'apparel';

interface EnterpriseContextType {
  currentTenant: any;
  currentGroup: any;
  currentCompany: any;
  currentBranch: any;
  segment: Segment;
  subSegment: string;
  companySize: string;
  taxRegime: string;
  operationTypes: any[];
  isLoading: boolean;
  setCompany: (id: string) => Promise<void>;
  executiveCouncil: {
    roles: string[];
    mission: string;
  };
}

const EnterpriseContext = createContext<EnterpriseContextType | undefined>(undefined);

export const EnterpriseProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentTenant, setCurrentTenant] = useState<any>(null);
  const [currentGroup, setCurrentGroup] = useState<any>(null);
  const [currentCompany, setCurrentCompany] = useState<any>(null);
  const [currentBranch, setCurrentBranch] = useState<any>(null);
  const [segment, setSegment] = useState<Segment>('general');
  const [subSegment, setSubSegment] = useState<string>('');
  const [companySize, setCompanySize] = useState<string>('Pequeno');
  const [taxRegime, setTaxRegime] = useState<string>('Simples Nacional');
  const [operationTypes, setOperationTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const executiveCouncil = {
    roles: [
      'CTO Global', 'Arquiteto SAP S/4HANA', 'Arquiteto SAP Business One', 
      'Arquiteto TOTVS Protheus', 'Arquiteto Sankhya', 'Arquiteto Oracle Netsuite', 
      'Especialista Microsoft Dynamics', 'Especialista ERP Industrial', 'Especialista PCP/MRP/APS',
      'Especialista WMS/TMS', 'Especialista Fiscal Brasileiro', 'Especialista Contábil',
      'Especialista Supply', 'Especialista IA Empresarial', 'Especialista UX Enterprise'
    ],
    mission: 'Construir uma plataforma ERP Enterprise Multivertical, Multiempresa, Inteligente, Adaptativa, Escalável e Orientada a Dados.'
  };

  useEffect(() => {
    loadActiveTenant();
  }, []);

  const loadActiveTenant = async () => {
    setIsLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (user) {
        // Load hierarchy via the new view
        const { data: hierarchy, error: hError } = await (supabase.from as any)('vw_organizational_hierarchy')
          .select('*')
          .limit(1)
          .single();
        
        if (hierarchy) {
          const h = hierarchy as any;
          const { data: company } = await (supabase.from as any)('companies')
            .select('*')
            .eq('id', h.unit_id)
            .single();

          if (company) {
            setCurrentCompany(company);
            setCurrentTenant({ id: h.tenant_id, name: h.tenant_name });
            setCurrentGroup({ id: h.enterprise_group_id, name: h.group_name });
            setSegment((company.segment as any) || 'general');
            setSubSegment(company.sub_segment || '');
            setCompanySize(company.company_size || 'Pequeno');
            setTaxRegime((company.tax_regime as string) || 'Simples Nacional');
            setOperationTypes((company.operation_types as any[]) || []);
          }
        }
      }
    } catch (error: any) {
      if (error?.message?.includes('JWT') || error?.status === 401) {
        // Silently ignore auth errors during initialization as useAuth handles redirect
      } else {
        console.error('Error loading enterprise context:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const setCompany = async (id: string) => {
    const { data } = await (supabase.from as any)('companies').select('*').eq('id', id).single();
    if (data) {
      setCurrentCompany(data);
      setSegment((data.segment as any) || 'general');
      setSubSegment(data.sub_segment || '');
      setCompanySize(data.company_size || 'Pequeno');
      setTaxRegime((data.tax_regime as string) || 'Simples Nacional');
      setOperationTypes((data.operation_types as any[]) || []);
    }
  };

  return (
    <EnterpriseContext.Provider value={{ 
      currentTenant: currentTenant || { id: '00000000-0000-0000-0000-000000000000', name: 'Tenant Padrão' },
      currentGroup: currentGroup || { id: '00000000-0000-0000-0000-000000000000', name: 'Grupo Padrão' },
      currentCompany, 
      currentBranch, 
      segment, 
      subSegment,
      companySize,
      taxRegime,
      operationTypes,
      isLoading, 
      setCompany,
      executiveCouncil
    }}>
      {children}
    </EnterpriseContext.Provider>
  );
};

export const useEnterprise = () => {
  const context = useContext(EnterpriseContext);
  if (!context) throw new Error('useEnterprise must be used within EnterpriseProvider');
  return context;
};
