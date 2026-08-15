import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transferWorkflow } from '@/services/operational/inventory/transferWorkflow';
import { useEventBus } from '@/core/events/useEventBus';
import { supabase } from '@/integrations/supabase/client';
import { useInventoryOrchestrator } from '@/core/orchestration/InventoryOrchestrator';
import { renderHook } from '@testing-library/react';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnValue({ error: null }),
      update: vi.fn().mockReturnValue({ 
        eq: vi.fn().mockReturnValue({ error: null }) 
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

describe('Logistic-Fiscal Traceability Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should propagate correlation_id from transferWorkflow through InventoryOrchestrator to FISCAL_OPERATION_REQUESTED', async () => {
    const correlationId = 'test-correlation-uuid';
    const transferId = 'test-transfer-id';
    const userId = 'test-user-id';
    const companyId = 'test-company-id';
    
    // 1. Setup Orquestradores e EventBus
    const eventBus = useEventBus.getState();
    const mockFiscalHandler = vi.fn();
    eventBus.subscribe('FISCAL_OPERATION_REQUESTED', mockFiscalHandler);

    // Mount Orchestrator (it subscribes to WORKFLOW_COMPLETED)
    renderHook(() => useInventoryOrchestrator(companyId));

    // 2. Act: Trigger transition (Status: EM TRÂNSITO)
    // InventoryOrchestrator listens for (status === 'EM TRÂNSITO' && type === 'TRANSFER')
    await transferWorkflow.transition({
      transferId,
      toStatus: 'EM TRÂNSITO' as any,
      userId,
      correlationId
    });

    // 3. Assert: Verify end-to-end propagation
    // We need to wait for two setTimeout(0) cycles in sequence:
    // 1. EventBus.publish (WORKFLOW_COMPLETED)
    // 2. InventoryOrchestrator.handleTransferShipped -> EventBus.publish (FISCAL_OPERATION_REQUESTED)
    
    // Wait for all microtasks and event bus timeouts
    for (let i = 0; i < 5; i++) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    expect(mockFiscalHandler).toHaveBeenCalledWith(expect.objectContaining({
      originId: transferId,
      correlationId,
      companyId: companyId,
      type: 'TRANSFER_OUT'
    }));
  });
});
