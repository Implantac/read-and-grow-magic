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
    
    // Manual subscription setup to test the logic directly if Hook fails to subscribe in time
    const eventBus = useEventBus.getState();
    const mockFiscalHandler = vi.fn();
    eventBus.subscribe('FISCAL_OPERATION_REQUESTED', mockFiscalHandler);

    // Mount the hook to trigger the Effect
    const { rerender } = renderHook(({ cid }) => useInventoryOrchestrator(cid), {
      initialProps: { cid: companyId }
    });
    
    // Wait for the useEffect in useInventoryOrchestrator to fire and register subscribers
    // React 18 act() handles the effects, but we need to wait for microtasks
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
    });

    // Verify subscription status
    let subscribers = useEventBus.getState().subscribers['WORKFLOW_COMPLETED'];
    
    // If it hasn't subscribed yet, we might need a rerender or more time
    if (!subscribers || subscribers.size === 0) {
      console.log('Rerendering hook...');
      await act(async () => {
        rerender({ cid: companyId });
        await new Promise(resolve => setTimeout(resolve, 500));
      });
      subscribers = useEventBus.getState().subscribers['WORKFLOW_COMPLETED'];
    }

    expect(subscribers?.size).toBeGreaterThan(0);

    // 2. Publish event directly via store
    await act(async () => {
      eventBus.publish('WORKFLOW_COMPLETED', {
        transferId,
        status: 'EXPEDIDA',
        type: 'TRANSFER',
        companyId,
        correlationId
      });
    });

    // 3. Robust Polling
    for (let i = 0; i < 30; i++) {
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      if (mockFiscalHandler.mock.calls.length > 0) break;
    }

    expect(mockFiscalHandler).toHaveBeenCalledWith(expect.objectContaining({
      originId: transferId,
      correlationId,
      companyId: companyId,
      type: 'TRANSFER_OUT'
    }));
  }, 15000);
});
