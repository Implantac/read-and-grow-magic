import { createContext, useContext, useMemo } from 'react';
import { useEnterprise } from '@/core/auth/EnterpriseContext';

/**
 * Enterprise Policy Engine
 * 
 * Centraliza as regras de negócio por Tenant/Empresa.
 * P1 - Contratos: Define quem manda em quê e quais os limites operacionais.
 */

export interface ERPPolicy {
  inventory: {
    allowNegativeStock: boolean;
    autoAdjustmentThreshold: number;
    requiresTransferApproval: boolean;
    minCoverageDays: number;
  };
  commercial: {
    maxDiscountPercentage: number;
    strictCreditCheck: boolean;
    autoOrderApproval: boolean;
  };
  financial: {
    autoReconcile: boolean;
    maxPaymentAdvance: number;
  };
  fiscal: {
    autoInvoiceEmission: boolean;
    homologationMode: boolean;
  };
}

const DEFAULT_POLICY: ERPPolicy = {
  inventory: {
    allowNegativeStock: false,
    autoAdjustmentThreshold: 10,
    requiresTransferApproval: true,
    minCoverageDays: 7,
  },
  commercial: {
    maxDiscountPercentage: 15,
    strictCreditCheck: true,
    autoOrderApproval: false,
  },
  financial: {
    autoReconcile: false,
    maxPaymentAdvance: 0,
  },
  fiscal: {
    autoInvoiceEmission: false,
    homologationMode: true,
  },
};

const PolicyContext = createContext<ERPPolicy>(DEFAULT_POLICY);

export function PolicyProvider({ children }: { children: React.ReactNode }) {
  const { currentCompany, segment } = useEnterprise();

  const policy = useMemo(() => {
    // Aqui no futuro carregaremos as políticas do banco de dados (public.enterprise_policies)
    // Por enquanto, aplicamos defaults baseados no segmento ou configurações da empresa
    const base = { ...DEFAULT_POLICY };

    if (segment === 'retail') {
      base.inventory.allowNegativeStock = false;
      base.commercial.autoOrderApproval = true;
    }

    if (currentCompany?.metadata?.policies) {
      return { ...base, ...currentCompany.metadata.policies };
    }

    return base;
  }, [currentCompany, segment]);

  return (
    <PolicyContext.Provider value={policy}>
      {children}
    </PolicyContext.Provider>
  );
}

export const usePolicy = () => useContext(PolicyContext);
