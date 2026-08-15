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
    }))
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
    
    const eventBus = useEventBus.getState();
    const mockFiscalHandler = vi.fn();
    const mockWorkflowHandler = vi.fn();
    
    eventBus.subscribe('FISCAL_OPERATION_REQUESTED', mockFiscalHandler);
    eventBus.subscribe('WORKFLOW_COMPLETED', mockWorkflowHandler);

    // Initialize Orchestrator
    renderHook(() => useInventoryOrchestrator(companyId));

    // Status matching orchestrator: EXPEDIDA
    const status: TransferStatus = 'EXPEDIDA';
    
    await act(async () => {
      await transferWorkflow.transition({
        transferId,
        toStatus: status,
        userId,
        correlationId
      });
    });

    // Wait for event chain
    for (let i = 0; i < 50; i++) {
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
      });
      if (mockFiscalHandler.mock.calls.length > 0) break;
    }

    // Diagnostics
    if (mockWorkflowHandler.mock.calls.length === 0) {
      console.log('FAIL: WORKFLOW_COMPLETED never received');
    }
    if (mockFiscalHandler.mock.calls.length === 0) {
      console.log('FAIL: FISCAL_OPERATION_REQUESTED never received');
      if (mockWorkflowHandler.mock.calls.length > 0) {
         console.log('WORKFLOW_COMPLETED was received with:', JSON.stringify(mockWorkflowHandler.mock.calls[0][0]));
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
