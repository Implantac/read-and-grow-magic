import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type Segment = 'textile' | 'food_factory' | 'pharma' | 'distribution' | 'services' | 'retail' | 'general' | 'fio' | 'tecelagem' | 'animal_feed' | 'industry' | 'wholesaler' | 'retail_chain' | 'franchise' | 'holding' | 'apparel';

type CompanyRow = Database['public']['Tables']['companies']['Row'];

export interface TenantRef { id: string; name: string }
export interface GroupRef { id: string; name: string }
export interface BranchRef { 
  id: string; 
  name: string; 
  code?: string; 
  tipo?: 'FACTORY' | 'DISTRIBUTION_CENTER' | 'STORE' | 'industria' | 'filial' | 'cd' | string;
}


interface HierarchyRow {
  tenant_id: string;
  tenant_name: string;
  enterprise_group_id: string;
  group_name: string;
  company_id: string;
  unit_id: string;
  unit_name: string;
  level: string;
}

export type OperationType = string | { key: string; label?: string };

export interface Policy {
  replenishmentMethod: 'MIN_MAX' | 'FORECAST' | 'MRP' | 'MANUAL' | 'AI_ASSISTED';
  transferApprovalLimit: number;
  inventoryAdjustmentPolicy: 'AUTO' | 'MANAGER_APPROVAL' | 'AUDIT_REQUIRED';
  salesCreditCheck: 'NONE' | 'BASIC' | 'STRICT';
  workflowEnabled: boolean;
  eventOrchestrationEnabled: boolean;
  auditLevel: 'NONE' | 'BASIC' | 'FULL';
  taskBoardEnabled: boolean;
}

interface EnterpriseContextType {
  currentTenant: TenantRef | null;
  currentGroup: GroupRef | null;
  currentCompany: CompanyRow | null;
  currentBranch: BranchRef | null;
  allBranches: BranchRef[];
  segment: Segment;
  subSegment: string;
  companySize: string;
  taxRegime: string;
  operationTypes: OperationType[];
  policies: Policy;
  isLoading: boolean;
  setCompany: (id: string) => Promise<void>;
  setBranch: (id: string | null) => void;
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
  const [currentBranch, setCurrentBranch] = useState<BranchRef | null>(null);
  const [allBranches, setAllBranches] = useState<BranchRef[]>([]);

  const [segment, setSegment] = useState<Segment>('general');
  const [subSegment, setSubSegment] = useState<string>('');
  const [companySize, setCompanySize] = useState<string>('Pequeno');
  const [taxRegime, setTaxRegime] = useState<string>('Simples Nacional');
  const [operationTypes, setOperationTypes] = useState<OperationType[]>([]);
  const [policies, setPolicies] = useState<Policy>({
    replenishmentMethod: 'MIN_MAX',
    transferApprovalLimit: 0,
    inventoryAdjustmentPolicy: 'AUTO',
    salesCreditCheck: 'NONE',
    workflowEnabled: false,
    eventOrchestrationEnabled: false,
    auditLevel: 'BASIC',
    taskBoardEnabled: true
  });
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

  const applyCompany = useCallback(async (company: CompanyRow) => {
    if (!company) return;
    const { getEnterprisePolicies } = await import('@/core/orchestration/policyEngine');
    
    setCurrentCompany(prev => (prev?.id === company.id ? prev : company));
    const seg = (company.segment as Segment | null) ?? 'general';
    setSegment(seg);
    setSubSegment(company.sub_segment ?? '');
    setCompanySize(company.company_size ?? 'Pequeno');
    setTaxRegime((company.tax_regime as string | null) ?? 'Simples Nacional');
    setOperationTypes((company.operation_types as OperationType[] | null) ?? []);
    setPolicies(getEnterprisePolicies(seg));
  }, []);

  const loadActiveTenant = useCallback(async (isMounted: () => boolean) => {
    setIsLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      if (!isMounted()) return;

      if (user) {
        // Optimistically fetch company and branches in parallel
        const [{ data: companies }, { data: profile }] = await Promise.all([
          supabase.from('companies').select('*').limit(1),
          supabase.from('profiles').select('default_branch_id').eq('id', user.id).maybeSingle()
        ]);

        if (!isMounted()) return;

        if (companies && companies.length > 0) {
          const company = companies[0];
          await applyCompany(company as CompanyRow);
          
          const { data: units } = await supabase
            .from('operational_units' as any)
            .select('id, name, type, is_active')
            .eq('company_id', company.id);
          
          if (!isMounted()) return;

          if (units) {
            const mappedUnits = units.map((u: any) => ({
              id: u.id,
              name: u.name,
              tipo: u.type.toUpperCase() as BranchRef['tipo'],
              is_active: u.is_active
            }));
            setAllBranches(mappedUnits);
            
            const defaultBranch = mappedUnits.find(b => b.id === profile?.default_branch_id) || mappedUnits[0] || null;
            setCurrentBranch(prev => prev?.id === defaultBranch?.id ? prev : defaultBranch);
            
            if (defaultBranch) {
              const { useEnterpriseStore } = await import('@/core/stores/useEnterpriseStore');
              useEnterpriseStore.getState().setActiveBranchId(defaultBranch.id);
            }
          }
        }
      }
    } catch (error: unknown) {
      console.error('Enterprise context error:', error);
    } finally {
      if (isMounted()) setIsLoading(false);
    }
  }, [applyCompany]);

  useEffect(() => {
    let mounted = true;
    const isMounted = () => mounted;
    
    const init = async () => {
      await loadActiveTenant(isMounted);
    };
    
    init();
    
    return () => {
      mounted = false;
    };
  }, [loadActiveTenant]);


  const setCompany = useCallback(async (id: string) => {
    const { data } = await supabase.from('companies').select('*').eq('id', id).maybeSingle();
    if (data) {
      applyCompany(data as CompanyRow);
      const { useEnterpriseStore } = await import('@/core/stores/useEnterpriseStore');
      useEnterpriseStore.getState().setActiveCompanyId(id);
    }
  }, [applyCompany]);

  const setBranch = useCallback(async (id: string | null) => {
    if (!id) {
      setCurrentBranch(null);
      const { useEnterpriseStore } = await import('@/core/stores/useEnterpriseStore');
      useEnterpriseStore.getState().setActiveBranchId(null);
      return;
    }
    const branch = allBranches.find(b => b.id === id);
    if (branch) {
      setCurrentBranch(prev => prev?.id === branch.id ? prev : branch);
      const { useEnterpriseStore } = await import('@/core/stores/useEnterpriseStore');
      useEnterpriseStore.getState().setActiveBranchId(id);
    }
  }, [allBranches]);

  const value = useMemo(() => ({
    currentTenant,
    currentGroup,
    currentCompany,
    currentBranch,
    allBranches,
    segment,
    subSegment,
    companySize,
    taxRegime,
    operationTypes,
    policies,
    isLoading,
    setCompany,
    setBranch,
    executiveCouncil
  }), [
    currentTenant, currentGroup, currentCompany, currentBranch, allBranches,
    segment, subSegment, companySize, taxRegime, operationTypes,
    policies, isLoading, setCompany, setBranch
  ]);

  return (
    <EnterpriseContext.Provider value={value}>
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
