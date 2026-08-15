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
    
    // Use the event bus directly from the store to avoid hook-related timing issues in dispatch
    const eventBus = useEventBus.getState();
    const mockFiscalHandler = vi.fn();
    eventBus.subscribe('FISCAL_OPERATION_REQUESTED', mockFiscalHandler);

    // 1. Initialize Hook and wait for registration
    // The hook uses useEffect to subscribe to the event bus.
    renderHook(() => useInventoryOrchestrator(companyId));
    
    // Wait for the useEffect in useInventoryOrchestrator to run
    // Since useEventBus is a Zustand store, the subscription is immediate but inside useEffect
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    // 2. Publish event
    // The Orchestrator should now be subscribed and handle this
    await act(async () => {
      eventBus.publish('WORKFLOW_COMPLETED', {
        transferId,
        status: 'EXPEDIDA',
        type: 'TRANSFER',
        companyId,
        correlationId
      });
    });

    // 3. Poll for the resulting FISCAL_OPERATION_REQUESTED event
    // The EventBus uses setTimeout(..., 0) for publish, and the Orchestrator also uses one.
    // We need at least 2 ticks + any React re-renders.
    let found = false;
    for (let i = 0; i < 20; i++) {
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
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
