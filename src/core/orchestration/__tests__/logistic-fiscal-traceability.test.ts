import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useEventBus } from '@/core/events/useEventBus';
import { useInventoryOrchestrator } from '@/core/orchestration/InventoryOrchestrator';
import { renderHook, act } from '@testing-library/react';

// Mock Dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnValue({ error: null }),
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ error: null }) }),
      select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn().mockReturnValue({ data: {} }) }) }),
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

describe('Logistic-Fiscal Traceability Integration (Direct Event Test)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useEventBus.setState({ subscribers: {} });
  });

  it('should propagate correlation_id when WORKFLOW_COMPLETED is published', async () => {
    const correlationId = 'test-correlation-uuid';
    const transferId = 'test-transfer-id';
    const companyId = 'test-company-id';
    
    // Initialize the event bus
    const eventBus = useEventBus.getState();
    const mockFiscalHandler = vi.fn();
    eventBus.subscribe('FISCAL_OPERATION_REQUESTED', mockFiscalHandler);

    // Initialize Hook
    renderHook(() => useInventoryOrchestrator(companyId));
    
    // Crucial: Wait for the subscription inside useEffect to settle
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
    });

    // Publish event - This triggers handleTransferShipped in Orchestrator
    await act(async () => {
      eventBus.publish('WORKFLOW_COMPLETED', {
        transferId,
        status: 'EXPEDIDA',
        type: 'TRANSFER',
        companyId,
        correlationId
      });
    });

    // Poll for the resulting FISCAL_OPERATION_REQUESTED event
    // The EventBus uses setTimeout(..., 0) for publish, and the Orchestrator handleTransferShipped also uses one.
    // Total of 3 async jumps (publish -> orchestrator receive -> orchestrator publish -> mock receive)
    let found = false;
    for (let i = 0; i < 50; i++) {
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      if (mockFiscalHandler.mock.calls.length > 0) {
        found = true;
        break;
      }
    }

    expect(mockFiscalHandler).toHaveBeenCalledWith(expect.objectContaining({
      originId: transferId,
      correlationId,
      companyId: companyId,
      type: 'TRANSFER_OUT'
    }));
  });
});
