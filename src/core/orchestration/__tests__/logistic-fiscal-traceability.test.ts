import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useEventBus } from '@/core/events/useEventBus';

describe('Logistic-Fiscal Traceability Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useEventBus.setState({ subscribers: {} });
  });

  it('should propagate correlation_id through the event bus', async () => {
    const correlationId = 'test-correlation-uuid';
    const transferId = 'test-transfer-id';
    const companyId = 'test-company-id';
    const eventBus = useEventBus.getState();

    const mockFiscalHandler = vi.fn();
    eventBus.subscribe('FISCAL_OPERATION_REQUESTED', mockFiscalHandler);

    // Lógica espelhada do InventoryOrchestrator.ts:handleTransferShipped
    // Confirma que o correlationId recebido é repassado para o próximo evento.
    eventBus.subscribe('WORKFLOW_COMPLETED', (payload: any) => {
      if (payload.type === 'TRANSFER' && payload.status === 'EXPEDIDA') {
        eventBus.publish('FISCAL_OPERATION_REQUESTED', {
          originId: payload.transferId,
          type: 'TRANSFER_OUT',
          companyId: payload.companyId,
          correlationId: payload.correlationId,
          causationId: payload.transferId
        });
      }
    });

    // 1. Emite o evento logístico inicial
    eventBus.publish('WORKFLOW_COMPLETED', {
      transferId,
      status: 'EXPEDIDA',
      type: 'TRANSFER',
      companyId,
      correlationId
    });

    // 2. Aguarda propagação assíncrona (2 hops de setTimeout 0)
    for (let i = 0; i < 20; i++) {
      await new Promise(resolve => setTimeout(resolve, 50));
      if (mockFiscalHandler.mock.calls.length > 0) break;
    }

    // Validação Final: correlation_id deve ser idêntico ao original
    expect(mockFiscalHandler).toHaveBeenCalledWith(expect.objectContaining({
      originId: transferId,
      correlationId: correlationId,
      companyId: companyId,
      type: 'TRANSFER_OUT'
    }));
  });
});
