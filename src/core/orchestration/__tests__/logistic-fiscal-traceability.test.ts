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
    
    // Mount the hook to trigger the Effect
    renderHook(() => useInventoryOrchestrator(companyId));
    
    // Crucial: useEventBus is a Zustand store. useEffect in useInventoryOrchestrator 
    // runs AFTER the first render. act() ensures effects are flushed.
    await act(async () => {
        // Just a small wait for the React loop to finish effects
        await new Promise(resolve => setTimeout(resolve, 0));
    });

    const eventBus = useEventBus.getState();
    const mockFiscalHandler = vi.fn();
    eventBus.subscribe('FISCAL_OPERATION_REQUESTED', mockFiscalHandler);

    // Verify subscription actually occurred
    const subscribers = useEventBus.getState().subscribers['WORKFLOW_COMPLETED'];
    expect(subscribers?.size).toBeGreaterThan(0);

    // Publish event
    await act(async () => {
      eventBus.publish('WORKFLOW_COMPLETED', {
        transferId,
        status: 'EXPEDIDA',
        type: 'TRANSFER',
        companyId,
        correlationId
      });
    });

    // We need to wait for TWO setTimeout(..., 0) calls in the event chain:
    // 1. EventBus.publish(WORKFLOW_COMPLETED) -> setTimeout 0 -> call subscribers
    // 2. Orchestrator -> eventBus.publish(FISCAL_OPERATION_REQUESTED) -> setTimeout 0 -> call subscribers
    for (let i = 0; i < 20; i++) {
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });
      if (mockFiscalHandler.mock.calls.length > 0) break;
    }

    expect(mockFiscalHandler).toHaveBeenCalledWith(expect.objectContaining({
      originId: transferId,
      correlationId,
      companyId: companyId,
      type: 'TRANSFER_OUT'
    }));
  }, 10000); // 10s timeout
});
