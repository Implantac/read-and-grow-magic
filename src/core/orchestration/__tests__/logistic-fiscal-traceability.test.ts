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
    // We do NOT reset subscribers here because the renderHook might have subscribed already
    // Instead, we ensure a fresh start by using a unique event name if needed, 
    // but resetting the store state is standard.
    useEventBus.setState({ subscribers: {} });
  });

  it('should propagate correlation_id when WORKFLOW_COMPLETED is published', async () => {
    const correlationId = 'test-correlation-uuid';
    const transferId = 'test-transfer-id';
    const companyId = 'test-company-id';
    
    // 1. Initialize Hook FIRST
    const { rerender } = renderHook(({ cid }) => useInventoryOrchestrator(cid), {
      initialProps: { cid: companyId }
    });
    
    // Wait for the useEffect to fire and subscribe
    // React 18 act() handles the effects
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    const eventBus = useEventBus.getState();
    const mockFiscalHandler = vi.fn();
    eventBus.subscribe('FISCAL_OPERATION_REQUESTED', mockFiscalHandler);

    // Verify subscription count via debug (optional)
    const subs = useEventBus.getState().subscribers['WORKFLOW_COMPLETED'];
    console.log('WORKFLOW_COMPLETED subscribers count:', subs ? subs.size : 0);

    // 2. Publish event
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

    // 3. Poll for the resulting FISCAL_OPERATION_REQUESTED event
    // The EventBus uses setTimeout(..., 0) for publish.
    // Jump 1: WORKFLOW_COMPLETED publish -> setTimeout 0 -> Orchestrator handle
    // Jump 2: Orchestrator handle -> FISCAL_OPERATION_REQUESTED publish -> setTimeout 0 -> mock handle
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
  });
});
