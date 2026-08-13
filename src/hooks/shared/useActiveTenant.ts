import { useAppStore } from '@/stores/useAppStore';
import { useEnterpriseStore } from '@/core/stores/useEnterpriseStore';
import { useEnterprise } from '@/core/auth/EnterpriseContext';

/**
 * Hook centralizado para acessar informações do inquilino (tenant) ativo.
 * Unifica o acesso aos stores e ao contexto, reduzindo acoplamento.
 */
export const useActiveTenant = () => {
  const enterprise = useEnterprise();
  const appStore = useAppStore();
  const enterpriseStore = useEnterpriseStore();

  return {
    // Dados do Contexto (Tempo de Execução/Orquestração)
    company: enterprise.currentCompany,
    branch: enterprise.currentBranch,
    branches: enterprise.allBranches,
    policies: enterprise.policies,
    segment: enterprise.segment,
    isLoading: enterprise.isLoading,

    // Dados do Store (Persistência/UI)
    user: appStore.user,
    role: appStore.userRole,
    activeCompanyId: enterpriseStore.activeCompanyId,
    activeBranchId: enterpriseStore.activeBranchId,

    // Actions
    setCompany: enterprise.setCompany,
    setBranch: enterprise.setBranch,
  };
};
