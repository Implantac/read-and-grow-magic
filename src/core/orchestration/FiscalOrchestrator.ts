import { useEventBus } from '@/core/events/useEventBus';
import { usePolicy } from '@/core/orchestration/policyEngine';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { useEffect, useRef, useCallback } from 'react';
import { fiscalService } from '@/services/fiscal/fiscalService';
import { supabase } from '@/integrations/supabase/client';
import { toastSuccess, toastError } from '@/lib/toastHelpers';

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
        // 1. Buscar dados da transferência para montar a NF-e
        const { data: transfer, error: transferError } = await supabase
          .from('stock_transfer_orders')
          .select('*, items:stock_transfer_items(*)')
          .eq('id', payload.originId)
          .single();

        if (transferError || !transfer) throw new Error('Transferência não encontrada');

        // 2. Criar rascunho de NF-e
        // number e series são obrigatórios no schema DB
        const nextNumber = Math.floor(Math.random() * 999999).toString();
        
        const { data: nfe, error: nfeError } = await supabase
          .from('nfe')
          .insert({
            company_id: companyId,
            operation_type: 'saida',
            status: 'draft',
            number: nextNumber,
            series: '1',
            total: transfer.items?.reduce((acc: number, item: any) => acc + (Number(item.requested_qty) * 10), 0) || 0, // Mock price for now
            client_name: transfer.destination_unit_id, // Simplificação
            correlation_id: payload.correlationId
          } as any) // Use as any to bypass generated types if correlation_id isn't updated in types.ts yet
          .select()
          .single();

        if (nfeError) throw nfeError;

        toastSuccess(`NF-e de transferência gerada automaticamente: ${nfe.id.split('-')[0]}`);

        // 3. Se política for STRICT AUTO, transmitir imediatamente
        if (policies.fiscal.autoInvoiceEmission) {
          await fiscalService.transmitNFe(nfe.id);
          toastSuccess(`NF-e ${nfe.id.split('-')[0]} autorizada com sucesso.`);
        }
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
