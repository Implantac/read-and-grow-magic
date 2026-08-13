import { Segment } from '@/core/auth/EnterpriseContext';

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

const DEFAULT_POLICIES: Record<string, Policy> = {
  retail_chain: {
    replenishmentMethod: 'AI_ASSISTED',
    transferApprovalLimit: 5000,
    inventoryAdjustmentPolicy: 'MANAGER_APPROVAL',
    salesCreditCheck: 'STRICT',
    workflowEnabled: true,
    eventOrchestrationEnabled: true,
    auditLevel: 'FULL',
    taskBoardEnabled: true
  },
  industry: {
    replenishmentMethod: 'MRP',
    transferApprovalLimit: 10000,
    inventoryAdjustmentPolicy: 'AUDIT_REQUIRED',
    salesCreditCheck: 'BASIC',
    workflowEnabled: true,
    eventOrchestrationEnabled: true,
    auditLevel: 'FULL',
    taskBoardEnabled: true
  },
  general: {
    replenishmentMethod: 'MIN_MAX',
    transferApprovalLimit: 2000,
    inventoryAdjustmentPolicy: 'AUTO',
    salesCreditCheck: 'NONE',
    workflowEnabled: false,
    eventOrchestrationEnabled: false,
    auditLevel: 'BASIC',
    taskBoardEnabled: true
  }
};

export const getEnterprisePolicies = (segment: string): Policy => {
  return DEFAULT_POLICIES[segment] || DEFAULT_POLICIES.general;
};
