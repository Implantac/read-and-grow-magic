import { useEventBus } from '@/core/events/useEventBus';
import { usePolicy } from '@/core/orchestration/policyEngine';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { useEffect, useRef, useCallback } from 'react';
import { toastError } from '@/lib/toastHelpers';

/**
 * Fiscal Orchestrator
 * 
 * Assina eventos de solicitação fiscal e automatiza a emissão de documentos.
 * P4 - Orquestração Cross-Module
 */
export const useFiscalOrchestrator = () => {
  const { currentCompany, isLoading: isContextLoading } = useEnterprise();
  const policies = usePolicy();
  const companyId = currentCompany?.id;
  const eventBus = useEventBus();
  
  const lastSubscribedCompanyId = useRef<string | null>(null);
  const isHandlingCleanup = useRef(false);

  const handleFiscalRequest = useCallback(async (payload: any) => {
    if (payload.companyId !== companyId) return;
    
    // Verifica política de emissão automática
    if (!policies.fiscal.autoTransferInvoice && payload.type === 'TRANSFER_OUT') {
      console.log('[FiscalOrchestrator] Auto emission disabled by policy', { type: payload.type });
      return;
    }

    console.log('[FiscalOrchestrator] Processing fiscal request', {
      originId: payload.originId,
      type: payload.type,
      correlationId: payload.correlationId
    });

    try {
      if (payload.type === 'TRANSFER_OUT') {
        throw new Error('Emissão automática de transferência aguarda numeração fiscal e valores reais dos itens.');
      }
    } catch (err) {
      console.error('[FiscalOrchestrator] Failed to process fiscal request:', err);
      toastError('Falha na automação fiscal. Verifique o painel de documentos.');
    }
  }, [companyId, policies.fiscal]);

  useEffect(() => {
    if (!companyId || isContextLoading) {
      lastSubscribedCompanyId.current = null;
      return;
    }

    if (lastSubscribedCompanyId.current === companyId) return;

    const currentId = companyId;
    lastSubscribedCompanyId.current = currentId;

    console.log(`[FiscalOrchestrator] Subscribing for company: ${currentId}`);
    const unsubscribe = eventBus.subscribe('FISCAL_OPERATION_REQUESTED', handleFiscalRequest);

    return () => {
      if (isHandlingCleanup.current) return;
      isHandlingCleanup.current = true;
      
      unsubscribe();
      
      setTimeout(() => {
        if (lastSubscribedCompanyId.current === currentId) {
          lastSubscribedCompanyId.current = null;
        }
        isHandlingCleanup.current = false;
      }, 100);
    };
  }, [companyId, eventBus, isContextLoading, handleFiscalRequest]);

  return {};
};
