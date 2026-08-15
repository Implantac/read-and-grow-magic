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
    })),
    rpc: vi.fn().mockReturnValue({ error: null })
  }
}));

vi.mock('@/core/auth/EnterpriseContext', () => ({
  useEnterprise: vi.fn(() => ({
    currentCompany: { id: 'test-company-id' },
    isLoading: false
  }))
}));

vi.mock('@/lib/toastHelpers', () => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn()
}));

describe('Logistic-Fiscal Traceability Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useEventBus.setState({ subscribers: {} });
  });

  it('should propagate correlation_id from transferWorkflow through InventoryOrchestrator to FISCAL_OPERATION_REQUESTED', async () => {
    const correlationId = 'test-correlation-uuid';
    const transferId = 'test-transfer-id';
    const userId = 'test-user-id';
    const companyId = 'test-company-id';
    
    // Mount Orchestrator FIRST to ensure it's subscribed before the event is published
    renderHook(() => useInventoryOrchestrator(companyId));

    const eventBus = useEventBus.getState();
    const mockFiscalHandler = vi.fn();
    const mockWorkflowHandler = vi.fn();
    
    eventBus.subscribe('FISCAL_OPERATION_REQUESTED', mockFiscalHandler);
    eventBus.subscribe('WORKFLOW_COMPLETED', mockWorkflowHandler);

    const status: TransferStatus = 'EXPEDIDA';
    
    // Trigger transition which publishes WORKFLOW_COMPLETED
    await act(async () => {
      await transferWorkflow.transition({
        transferId,
        toStatus: status,
        userId,
        correlationId
      });
    });

    // Increased polling time and iteration count to handle multiple async ticks (event bus use setTimeout 0)
    let found = false;
    for (let i = 0; i < 100; i++) {
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
      });
      if (mockFiscalHandler.mock.calls.length > 0) {
        found = true;
        break;
      }
    }

    if (!found) {
        console.log('Orchestration did not complete in time.');
        console.log('WORKFLOW_COMPLETED calls:', mockWorkflowHandler.mock.calls.length);
        if (mockWorkflowHandler.mock.calls.length > 0) {
            console.log('Payload:', JSON.stringify(mockWorkflowHandler.mock.calls[0][0]));
        }
    }

    expect(mockWorkflowHandler).toHaveBeenCalledWith(expect.objectContaining({
      transferId,
      correlationId,
      status: 'EXPEDIDA'
    }));

    expect(mockFiscalHandler).toHaveBeenCalledWith(expect.objectContaining({
      originId: transferId,
      correlationId,
      companyId: companyId,
      type: 'TRANSFER_OUT'
    }));
  });
});
