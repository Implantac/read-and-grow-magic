import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type Segment = 'textile' | 'food_factory' | 'pharma' | 'distribution' | 'services' | 'retail' | 'general' | 'fio' | 'tecelagem' | 'animal_feed' | 'industry' | 'wholesaler' | 'retail_chain' | 'franchise' | 'holding' | 'apparel';

type CompanyRow = Database['public']['Tables']['companies']['Row'];

export interface TenantRef { id: string; name: string }
export interface GroupRef { id: string; name: string }
export interface BranchRef { id: string; name: string }

interface HierarchyRow {
  tenant_id: string;
  tenant_name: string;
  enterprise_group_id: string;
  group_name: string;
  unit_id: string;
}

export type OperationType = string | { key: string; label?: string };

interface EnterpriseContextType {
  currentTenant: TenantRef | null;
  currentGroup: GroupRef | null;
  currentCompany: CompanyRow | null;
  currentBranch: BranchRef | null;
  segment: Segment;
  subSegment: string;
  companySize: string;
  taxRegime: string;
  operationTypes: OperationType[];
  isLoading: boolean;
  setCompany: (id: string) => Promise<void>;
  executiveCouncil: {
    roles: string[];
    mission: string;
  };
}

const EnterpriseContext = createContext<EnterpriseContextType | undefined>(undefined);

export const EnterpriseProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentTenant, setCurrentTenant] = useState<TenantRef | null>(null);
  const [currentGroup, setCurrentGroup] = useState<GroupRef | null>(null);
  const [currentCompany, setCurrentCompany] = useState<CompanyRow | null>(null);
  const [currentBranch] = useState<BranchRef | null>(null);
  const [segment, setSegment] = useState<Segment>('general');
  const [subSegment, setSubSegment] = useState<string>('');
  const [companySize, setCompanySize] = useState<string>('Pequeno');
  const [taxRegime, setTaxRegime] = useState<string>('Simples Nacional');
  const [operationTypes, setOperationTypes] = useState<OperationType[]>([]);
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
    // loadActiveTenant captures only stable setters; running once on mount is intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyCompany = (company: CompanyRow) => {
    setCurrentCompany(company);
    setSegment((company.segment as Segment | null) ?? 'general');
    setSubSegment(company.sub_segment ?? '');
    setCompanySize(company.company_size ?? 'Pequeno');
    setTaxRegime((company.tax_regime as string | null) ?? 'Simples Nacional');
    setOperationTypes((company.operation_types as OperationType[] | null) ?? []);
  };

  const loadActiveTenant = async () => {
    setIsLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (user) {
        // Load hierarchy via the view (view types may not be in generated Database)
        const fromAny = supabase.from as unknown as (rel: string) => ReturnType<typeof supabase.from>;
        const { data: hierarchyData } = await fromAny('vw_organizational_hierarchy')
          .select('*')
          .limit(1)
          .single();

        const hierarchy = hierarchyData as HierarchyRow | null;
        if (hierarchy) {
          const { data: company } = await supabase.from('companies')
            .select('*')
            .eq('id', hierarchy.unit_id)
            .single();

          if (company) {
            applyCompany(company as CompanyRow);
            setCurrentTenant({ id: hierarchy.tenant_id, name: hierarchy.tenant_name });
            setCurrentGroup({ id: hierarchy.enterprise_group_id, name: hierarchy.group_name });
          }
        }
      }
    } catch (error: unknown) {
      const err = error as { message?: string; status?: number };
      if (err?.message?.includes('JWT') || err?.status === 401) {
        // Silently ignore auth errors during initialization as useAuth handles redirect
      } else {
        console.error('Error loading enterprise context:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const setCompany = async (id: string) => {
    const { data } = await supabase.from('companies').select('*').eq('id', id).single();
    if (data) applyCompany(data as CompanyRow);
  };

  return (
    <EnterpriseContext.Provider value={{
      currentTenant: currentTenant ?? { id: '00000000-0000-0000-0000-000000000000', name: 'Tenant Padrão' },
      currentGroup: currentGroup ?? { id: '00000000-0000-0000-0000-000000000000', name: 'Grupo Padrão' },
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

// eslint-disable-next-line react-refresh/only-export-components
export const useEnterprise = () => {
  const context = useContext(EnterpriseContext);
  if (!context) throw new Error('useEnterprise must be used within EnterpriseProvider');
  return context;
};
