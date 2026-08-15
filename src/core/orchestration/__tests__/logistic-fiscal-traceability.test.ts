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
    
    // 1. Initialize Hook
    const { result } = renderHook(() => useInventoryOrchestrator(companyId));
    
    // Wait for useEffect
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    const eventBus = useEventBus.getState();
    const mockFiscalHandler = vi.fn();
    eventBus.subscribe('FISCAL_OPERATION_REQUESTED', mockFiscalHandler);

    // 2. Publish event that SHOULD be caught by Orchestrator
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

    // 3. Poll for result
    for (let i = 0; i < 50; i++) {
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
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
