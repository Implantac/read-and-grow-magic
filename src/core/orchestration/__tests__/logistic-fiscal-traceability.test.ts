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

// Mock toast helpers to avoid noise
vi.mock('@/lib/toastHelpers', () => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn()
}));

describe('Logistic-Fiscal Traceability Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset EventBus subscribers
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
    
    // Subscribe first
    eventBus.subscribe('FISCAL_OPERATION_REQUESTED', mockFiscalHandler);
    
    // Mock WORKFLOW_COMPLETED handler to debug
    const mockWorkflowHandler = vi.fn();
    eventBus.subscribe('WORKFLOW_COMPLETED', mockWorkflowHandler);

    // Mount Orchestrator (it subscribes to WORKFLOW_COMPLETED)
    renderHook(() => useInventoryOrchestrator(companyId));

    // 2. Act: Trigger transition
    const publishPromise = new Promise<void>((resolve) => {
      eventBus.subscribe('WORKFLOW_COMPLETED', (payload) => {
        console.log('EventBus received WORKFLOW_COMPLETED:', payload.status);
        resolve();
      });
    });

    await transferWorkflow.transition({
      transferId,
      toStatus: 'EM TRÂNSITO' as any,
      userId,
      correlationId
    });

    // 3. Assert: Verify end-to-end propagation
    await publishPromise;
    await new Promise(resolve => setTimeout(resolve, 50));

    console.log('Workflow Mock calls:', mockWorkflowHandler.mock.calls.length);
    if (mockWorkflowHandler.mock.calls.length > 0) {
      console.log('Workflow Mock payload:', JSON.stringify(mockWorkflowHandler.mock.calls[0][0]));
    }
    expect(mockWorkflowHandler).toHaveBeenCalled();

    expect(mockFiscalHandler).toHaveBeenCalledWith(expect.objectContaining({
      originId: transferId,
      correlationId,
      companyId: companyId,
      type: 'TRANSFER_OUT'
    }));
  });
});
