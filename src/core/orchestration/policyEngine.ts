import React, { createContext, useContext, useMemo } from 'react';
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
    replenishmentMethod: 'MIN_MAX' | 'FORECAST' | 'MRP' | 'MANUAL' | 'AI_ASSISTED';
    inventoryAdjustmentPolicy: 'AUTO' | 'MANAGER_APPROVAL' | 'AUDIT_REQUIRED';
    transferApprovalLimit: number;
  };
  commercial: {
    maxDiscountPercentage: number;
    strictCreditCheck: boolean;
    autoOrderApproval: boolean;
    salesCreditCheck: 'NONE' | 'BASIC' | 'STRICT';
  };
  financial: {
    autoReconcile: boolean;
    maxPaymentAdvance: number;
  };
  fiscal: {
    autoInvoiceEmission: boolean;
    homologationMode: boolean;
    taxRegime: string;
    autoTransferInvoice: boolean;
  };
  core: {
    workflowEnabled: boolean;
    eventOrchestrationEnabled: boolean;
    auditLevel: 'NONE' | 'BASIC' | 'FULL';
    taskBoardEnabled: boolean;
  };
}

const DEFAULT_POLICY: ERPPolicy = {
  inventory: {
    allowNegativeStock: false,
    autoAdjustmentThreshold: 10,
    requiresTransferApproval: true,
    minCoverageDays: 7,
    replenishmentMethod: 'MIN_MAX',
    inventoryAdjustmentPolicy: 'MANAGER_APPROVAL',
    transferApprovalLimit: 5000,
  },
  commercial: {
    maxDiscountPercentage: 15,
    strictCreditCheck: true,
    autoOrderApproval: false,
    salesCreditCheck: 'BASIC',
  },
  financial: {
    autoReconcile: false,
    maxPaymentAdvance: 0,
  },
  fiscal: {
    autoInvoiceEmission: false,
    homologationMode: true,
    taxRegime: 'Simples Nacional',
    autoTransferInvoice: true,
  },
  core: {
    workflowEnabled: true,
    eventOrchestrationEnabled: true,
    auditLevel: 'FULL',
    taskBoardEnabled: true,
  }
};

const PolicyContext = createContext<ERPPolicy>(DEFAULT_POLICY);

export function PolicyProvider({ children }: { children: React.ReactNode }) {
  const { currentCompany, segment } = useEnterprise();

  const policy = useMemo(() => {
    const base = { ...DEFAULT_POLICY };

    if (segment === 'retail') {
      base.inventory.allowNegativeStock = false;
      base.commercial.autoOrderApproval = true;
    }

    // @ts-ignore
    if (currentCompany?.metadata?.policies) {
      // @ts-ignore
      return { ...base, ...currentCompany.metadata.policies };
    }

    return base;
  }, [currentCompany, segment]);

  return React.createElement(PolicyContext.Provider, { value: policy }, children);
}

export const usePolicy = () => useContext(PolicyContext);

/**
 * Legacy support for EnterpriseContext.tsx
 */
export function getEnterprisePolicies(segment: string) {
  const base = DEFAULT_POLICY;
  return {
    replenishmentMethod: base.inventory.replenishmentMethod,
    transferApprovalLimit: base.inventory.transferApprovalLimit,
    inventoryAdjustmentPolicy: base.inventory.inventoryAdjustmentPolicy,
    salesCreditCheck: base.commercial.salesCreditCheck,
    workflowEnabled: base.core.workflowEnabled,
    eventOrchestrationEnabled: base.core.eventOrchestrationEnabled,
    auditLevel: base.core.auditLevel,
    taskBoardEnabled: base.core.taskBoardEnabled
  };
}
