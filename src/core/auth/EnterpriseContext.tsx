import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type MutableRefObject } from 'react';
import { withRenderMonitor } from '@/core/debug/RenderDepthMonitor';
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

export const EnterpriseProvider = withRenderMonitor(({ children }: { children: React.ReactNode }) => {
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
    
    setCurrentCompany(prev => {
      if (prev?.id === company.id) return prev;
      return { ...company };
    });

    const { getEnterprisePolicies } = await import('@/core/orchestration/policyEngine');
    const seg = (company.segment as Segment | null) ?? 'general';
    const nextPolicies = getEnterprisePolicies(seg);
    
    setSegment(prev => prev === seg ? prev : seg);
    setSubSegment(prev => prev === (company.sub_segment ?? '') ? prev : (company.sub_segment ?? ''));
    setCompanySize(prev => prev === (company.company_size ?? 'Pequeno') ? prev : (company.company_size ?? 'Pequeno'));
    setTaxRegime(prev => prev === ((company.tax_regime as string | null) ?? 'Simples Nacional') ? prev : ((company.tax_regime as string | null) ?? 'Simples Nacional'));
    setOperationTypes(prev => {
      const next = (company.operation_types as OperationType[] | null) ?? [];
      if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
      return next;
    });
    setPolicies(prev => {
      if (JSON.stringify(prev) === JSON.stringify(nextPolicies)) return prev;
      return nextPolicies;
    });
  }, []);

  const isSyncing = useRef(false);
  const lastSyncUser = useRef<string | null>(null);

  const loadActiveTenant = useCallback(async (isMounted: MutableRefObject<boolean>) => {
    if (!isMounted.current || isSyncing.current) return;
    
    isSyncing.current = true;
    
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      
      const user = session?.user;

      if (!user) {
        if (isMounted.current) {
          setCurrentCompany(null);
          setCurrentBranch(null);
          setAllBranches([]);
          setIsLoading(false);
          lastSyncUser.current = null;
        }
        return;
      }

      // Check if we already synced this user to avoid loop
      if (user.id === lastSyncUser.current && currentCompany) {
        return;
      }
      lastSyncUser.current = user.id;
      
      setIsLoading(true);

      const [companies, profile, role] = await Promise.all([
        TenantService.getCompanies(),
        TenantService.getUserProfile(user.id),
        TenantService.getUserRole(user.id)
      ]);

      if (!isMounted.current) return;

      // Update global app store with profile/role info once
      const { useAppStore } = await import('@/stores/useAppStore');
      const store = useAppStore.getState();
      const role = (role as any) || 'viewer';
      
      store.setUser({
        id: user.id,
        name: profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
        email: user.email || '',
        role: role,
        permissions: ['all'],
      });
      store.setUserRole(role);

      if (companies && companies.length > 0) {
        const company = companies.find(c => c.id === profile?.company_id) || companies[0];
        
        await applyCompany(company as CompanyRow);
        
        const units = await TenantService.getOperationalUnits(company.id);
        
        if (!isMounted.current) return;

        if (units) {
          const mappedUnits = units.map((u: any) => ({
            id: u.id,
            name: u.name,
            tipo: u.type.toUpperCase() as BranchRef['tipo'],
            is_active: u.is_active
          }));
          
          setAllBranches(prev => {
            if (prev.length === mappedUnits.length && prev.every((v, i) => v.id === mappedUnits[i].id)) return prev;
            return mappedUnits;
          });
          
          const defaultBranch = mappedUnits.find(b => b.id === profile?.default_branch_id) || mappedUnits[0] || null;
          
          setCurrentBranch(prev => {
            if (prev?.id === defaultBranch?.id) return prev;
            return defaultBranch ? { ...defaultBranch } : null;
          });
          
          if (defaultBranch) {
            const { useEnterpriseStore } = await import('@/core/stores/useEnterpriseStore');
            const enterpriseStore = useEnterpriseStore.getState();
            if (enterpriseStore.activeBranchId !== defaultBranch.id) {
              enterpriseStore.setActiveBranchId(defaultBranch.id);
            }
          }
        }
      }
    } catch (error: unknown) {
      if (isMounted.current) {
        console.error('Enterprise context error:', error);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        isSyncing.current = false;
      }
    }
  }, [applyCompany]);

  const mounted = useRef(true);
  const renderCount = useRef(0);
  
  useEffect(() => {
    mounted.current = true;

    renderCount.current++;
    
    if (renderCount.current > 100) {
      console.warn('[EnterpriseProvider] Excessive re-renders detected in context. Potential loop.');
    }

    const isMounted = mounted;
    
    // Initial load - use a small delay to let auth stabilize
    const timeout = setTimeout(() => {
      loadActiveTenant(isMounted);
    }, 50);

    // Sync with auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted.current) return;
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        loadActiveTenant(isMounted);
      } else if (event === 'SIGNED_OUT') {
        lastSyncUser.current = null;
        setCurrentCompany(null);
        setCurrentBranch(null);
        setAllBranches([]);
        setIsLoading(false);
      }
    });

    return () => {
      mounted.current = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
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
      setCurrentBranch(prev => {
        if (prev?.id === branch.id) return prev;
        return { ...branch };
      });
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
}, 'EnterpriseProvider');

// eslint-disable-next-line react-refresh/only-export-components
export const useEnterprise = () => {
  const context = useContext(EnterpriseContext);
  if (!context) throw new Error('useEnterprise must be used within EnterpriseProvider');
  return context;
};
