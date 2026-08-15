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
    
    // 1. Initialize Hook FIRST and ensure it renders completely
    const { result } = renderHook(() => useInventoryOrchestrator(companyId));
    
    // IMPORTANT: Wait for multiple React cycles to ensure useEffect has run and 
    // subscribers are registered in the event bus store.
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
    });

    const eventBus = useEventBus.getState();
    const mockFiscalHandler = vi.fn();
    
    // Subscribe our test listener
    eventBus.subscribe('FISCAL_OPERATION_REQUESTED', mockFiscalHandler);

    // Verify subscription
    const subs = useEventBus.getState().subscribers['WORKFLOW_COMPLETED'];
    if (!subs || subs.size === 0) {
      console.warn('CRITICAL: Orchestrator failed to subscribe to WORKFLOW_COMPLETED');
    } else {
      console.log(`WORKFLOW_COMPLETED subscribers: ${subs.size}`);
    }

    // 2. Publish event directly via store
    // This MUST trigger handleTransferShipped in the Orchestrator
    console.log('--- TEST: Publishing WORKFLOW_COMPLETED ---');
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
    // Jump 1: Publish -> setTimeout 0 -> callbacks
    // Jump 2: Orchestrator -> publish -> setTimeout 0 -> callbacks
    for (let i = 0; i < 50; i++) {
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      if (mockFiscalHandler.mock.calls.length > 0) break;
    }

    if (mockFiscalHandler.mock.calls.length === 0) {
      console.error('FAILED: FISCAL_OPERATION_REQUESTED was not published.');
      console.log('Final EventBus state:', JSON.stringify(Object.keys(useEventBus.getState().subscribers)));
    }

    expect(mockFiscalHandler).toHaveBeenCalledWith(expect.objectContaining({
      originId: transferId,
      correlationId,
      companyId: companyId,
      type: 'TRANSFER_OUT'
    }));
  });
});
