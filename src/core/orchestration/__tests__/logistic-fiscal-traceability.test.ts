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

// We force isLoading to false and a stable companyId
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
    
    // 1. Initialize Hook 
    // We pass the companyId explicitly to bypass context logic if needed
    renderHook(() => useInventoryOrchestrator(companyId));
    
    // Crucial: Wait long enough for the useEffect to fire. 
    // In React 18, useEffect runs after the browser paint (simulated in JSDOM).
    // act() will flush them.
    await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
    });

    const eventBus = useEventBus.getState();
    const mockFiscalHandler = vi.fn();
    eventBus.subscribe('FISCAL_OPERATION_REQUESTED', mockFiscalHandler);

    // Verify subscription actually occurred
    let subscribers = useEventBus.getState().subscribers['WORKFLOW_COMPLETED'];
    
    if (!subscribers || subscribers.size === 0) {
      // One last attempt to flush
      await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 500));
      });
      subscribers = useEventBus.getState().subscribers['WORKFLOW_COMPLETED'];
    }

    // Fail early with clear message if orchestrator is not listening
    if (!subscribers || subscribers.size === 0) {
      console.error('Available event types in bus:', Object.keys(useEventBus.getState().subscribers));
      throw new Error('FAILED: Orchestrator did not subscribe to WORKFLOW_COMPLETED. Check useEffect conditions in InventoryOrchestrator.ts');
    }

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
    for (let i = 0; i < 20; i++) {
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });
      if (mockFiscalHandler.mock.calls.length > 0) break;
    }

    expect(mockFiscalHandler).toHaveBeenCalledWith(expect.objectContaining({
      originId: transferId,
      correlationId,
      companyId: companyId,
      type: 'TRANSFER_OUT'
    }));
  }, 10000);
});
