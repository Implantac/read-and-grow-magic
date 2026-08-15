import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transferWorkflow, TransferStatus } from '@/services/operational/inventory/transferWorkflow';
import { useEventBus } from '@/core/events/useEventBus';
import { supabase } from '@/integrations/supabase/client';
import { useInventoryOrchestrator } from '@/core/orchestration/InventoryOrchestrator';
import { renderHook, act } from '@testing-library/react';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnValue({ error: null }),
      update: vi.fn().mockReturnValue({ 
        eq: vi.fn().mockReturnValue({ 
          eq: vi.fn().mockReturnValue({ error: null })
        }),
        match: vi.fn().mockReturnValue({ error: null })
      }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockReturnValue({
            data: {
              id: 'test-transfer-id',
              company_id: 'test-company-id',
              origin_unit_id: 'origin-id',
              destination_unit_id: 'dest-id',
              items: [
                { product_id: 'prod-1', requested_qty: 10 }
              ]
            }
          })
        })
      }),
      rpc: vi.fn().mockReturnValue({ error: null })
    }))
  }
}));

vi.mock('@/core/auth/EnterpriseContext', () => ({
  useEnterprise: vi.fn(() => ({
    currentCompany: { id: 'test-company-id' },
    isLoading: false
  }))
}));

// Mock toast helpers to avoid noise
vi.mock('@/lib/toastHelpers', () => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn()
}));

describe('Logistic-Fiscal Traceability Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset EventBus subscribers to avoid cross-test pollution
    useEventBus.setState({ subscribers: {} });
  });

  it('should propagate correlation_id from transferWorkflow through InventoryOrchestrator to FISCAL_OPERATION_REQUESTED', async () => {
    const correlationId = 'test-correlation-uuid';
    const transferId = 'test-transfer-id';
    const userId = 'test-user-id';
    const companyId = 'test-company-id';
    
    // 1. Setup Orquestradores e EventBus
    const eventBus = useEventBus.getState();
    const mockFiscalHandler = vi.fn();
    
    // Subscribe to the final event in the chain
    eventBus.subscribe('FISCAL_OPERATION_REQUESTED', mockFiscalHandler);
    
    // Subscribe to the intermediate event for debugging
    const mockWorkflowHandler = vi.fn();
    eventBus.subscribe('WORKFLOW_COMPLETED', mockWorkflowHandler);

    // Mount Orchestrator (it subscribes to WORKFLOW_COMPLETED and emits FISCAL_OPERATION_REQUESTED)
    renderHook(() => useInventoryOrchestrator(companyId));

    // 2. Act: Trigger transition (Status: EM TRÂNSITO)
    const status: TransferStatus = 'EM TRÂNSITO';
    
    await act(async () => {
      await transferWorkflow.transition({
        transferId,
        toStatus: status,
        userId,
        correlationId
      });
    });

    // 3. Assert: Verify end-to-end propagation
    // Aguarda múltiplos ciclos do EventBus (cada publish é um setTimeout 0)
    for (let i = 0; i < 20; i++) {
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
      });
    }

    // Verify intermediate event was received
    expect(mockWorkflowHandler).toHaveBeenCalledWith(expect.objectContaining({
      transferId,
      correlationId,
      status: 'EM TRÂNSITO'
    }));

    // Verify final event was received with preserved correlation_id
    expect(mockFiscalHandler).toHaveBeenCalledWith(expect.objectContaining({
      originId: transferId,
      correlationId,
      companyId: companyId,
      type: 'TRANSFER_OUT'
    }));
  });
});
