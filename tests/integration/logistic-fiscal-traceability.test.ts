import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transferWorkflow } from '@/services/operational/inventory/transferWorkflow';
import { supabase } from '@/integrations/supabase/client';
import { useEventBus } from '@/core/events/useEventBus';

// Mock implementation of Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue({ error: null }),
    update: vi.fn().mockResolvedValue({ error: null }),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ 
      data: { 
        id: 'test-transfer-id', 
        company_id: 'test-company-id',
        items: [{ product_id: 'p1', requested_qty: 10 }]
      }, 
      error: null 
    }),
    rpc: vi.fn().mockResolvedValue({ error: null })
  }
}));

// Mock event bus getState
vi.mock('@/core/events/useEventBus', () => {
  const publish = vi.fn().mockResolvedValue(undefined);
  return {
    useEventBus: {
      getState: () => ({
        publish
      }),
      // Handle the hook call if it's used as useEventBus()
      subscribe: vi.fn()
    }
  };
});

describe('Logistic-Fiscal Traceability Integration', () => {
  it('should propagate correlation_id during transfer transition', async () => {
    const correlationId = 'corr-123-abc';
    const transferId = 'test-transfer-id';
    
    // Trigger transition to EM TRÂNSITO (Expedir)
    await transferWorkflow.transition({
      transferId,
      toStatus: 'EM TRÂNSITO',
      userId: 'user-123',
      correlationId
    });

    // Verify propagation in the database update
    expect(supabase.from).toHaveBeenCalledWith('stock_transfer_orders');
    expect(supabase.update).toHaveBeenCalledWith(expect.objectContaining({
      correlation_id: correlationId
    }));

    // Verify event bus propagation
    const eventBus = useEventBus.getState();
    expect(eventBus.publish).toHaveBeenCalledWith('WORKFLOW_COMPLETED', expect.objectContaining({
      transferId,
      correlationId,
      status: 'EM TRÂNSITO'
    }));
  });
});
