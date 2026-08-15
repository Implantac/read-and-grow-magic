import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transferWorkflow } from '@/services/operational/inventory/transferWorkflow';
import { useEventBus } from '@/core/events/useEventBus';
import { supabase } from '@/integrations/supabase/client';

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

describe('Logistic-Fiscal Traceability Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should propagate correlation_id from transferWorkflow to EventBus', async () => {
    const correlationId = 'test-correlation-uuid';
    const transferId = 'test-transfer-id';
    const userId = 'test-user-id';
    
    // Subscribe to EventBus to verify publication
    const eventBus = useEventBus.getState();
    const mockHandler = vi.fn();
    eventBus.subscribe('WORKFLOW_COMPLETED', mockHandler);

    // Act
    await transferWorkflow.transition({
      transferId,
      toStatus: 'EM TRÂNSITO',
      userId,
      correlationId
    });

    // Wait for event bus async publish (setTimeout 0)
    await new Promise(resolve => setTimeout(resolve, 10));

    // Assert
    expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({
      transferId,
      correlationId,
      companyId: 'test-company-id'
    }));
  });
});
