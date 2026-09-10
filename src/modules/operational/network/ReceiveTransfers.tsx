import { useState } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Textarea } from '@/ui/base/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { EmptyState } from '@/shared/components/EmptyState';
import { PackageCheck, Truck, CheckCircle2 } from 'lucide-react';
import { useInboundTransfers, useTransferActions } from '@/hooks/operational/network/useTransfers';
import type { DivergenceReason, ItemQuantity, TransferStatus } from '@/services/operational/inventory/transferWorkflow';

const REASONS: { value: DivergenceReason; label: string }[] = [
  { value: 'FALTA', label: 'Falta' },
  { value: 'EXCESSO', label: 'Excesso' },
  { value: 'AVARIA', label: 'Avaria' },
  { value: 'PRODUTO_ERRADO', label: 'Produto errado' },
];

interface Draft {
  received: Record<string, number>;
  reasons: Record<string, DivergenceReason | undefined>;
  notes: string;
}

export default function ReceiveTransfersPage() {
  const { data: inbound = [], isLoading } = useInboundTransfers();
  const { advance, isAdvancing } = useTransferActions();
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});

  const draftFor = (order: any): Draft => {
    if (drafts[order.id]) return drafts[order.id];
    const received: Record<string, number> = {};
    (order.items || []).forEach((i: any) => {
      received[i.id] = Number(i.shipped_qty ?? i.requested_qty ?? 0);
    });
    return { received, reasons: {}, notes: '' };
  };

  const setDraft = (orderId: string, patch: Partial<Draft>, base: Draft) => {
    setDrafts((prev) => ({ ...prev, [orderId]: { ...base, ...patch } }));
  };

  const receiveAll = (order: any) => {
    const received: Record<string, number> = {};
    (order.items || []).forEach((i: any) => {
      received[i.id] = Number(i.shipped_qty ?? i.requested_qty ?? 0);
    });
    setDrafts((prev) => ({ ...prev, [order.id]: { received, reasons: {}, notes: prev[order.id]?.notes || '' } }));
  };

  const confirm = async (order: any) => {
    const draft = draftFor(order);
    const items: ItemQuantity[] = (order.items || []).map((item: any) => ({
      itemId: item.id,
      quantity: Number(draft.received[item.id] ?? 0),
      divergenceReason: draft.reasons[item.id],
      notes: draft.notes,
    }));

    let hasShortage = false;
    let hasDivergence = false;
    (order.items || []).forEach((item: any) => {
      const shipped = Number(item.shipped_qty ?? item.requested_qty ?? 0);
      const got = Number(draft.received[item.id] ?? 0);
      if (got < shipped) hasShortage = true;
      if (got !== shipped) hasDivergence = true;
    });

    const toStatus: TransferStatus = !hasDivergence
      ? 'RECEBIDA'
      : hasShortage
        ? 'RECEBIDA PARCIAL'
        : 'RECEBIDA COM DIVERGÊNCIA';

    // Se a mercadoria ainda está como expedida, marca o trânsito antes de receber.
    if (order.current_status === 'EXPEDIDA') {
      await advance({ transferId: order.id, toStatus: 'EM TRÂNSITO', correlationId: order.correlation_id || undefined });
    }

    await advance({
      transferId: order.id,
      toStatus,
      itemQuantities: items,
      notes: draft.notes,
      correlationId: order.correlation_id || undefined,
    });

    setDrafts((prev) => {
      const next = { ...prev };
      delete next[order.id];
      return next;
    });
  };

  return (
    <PageContainer loading={isLoading}>
      <PageHeader
        title="Receber Mercadoria"
        description="Confira o que chegou na sua unidade e registre faltas, sobras ou avarias"
      />

      {inbound.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="Nada a receber agora"
          description="Quando uma transferência for enviada para esta unidade, ela aparece aqui para conferência."
        />
      ) : (
        <div className="space-y-4">
          {inbound.map((order: any) => {
            const draft = draftFor(order);
            return (
              <Card key={order.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
                    <span className="flex items-center gap-2">
                      <PackageCheck className="h-4 w-4" />
                      TRF-{String(order.order_number || '').padStart(5, '0')} • de {order.origin?.name || 'origem'}
                    </span>
                    <Badge variant="outline">{order.current_status}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {(order.items || []).map((item: any) => {
                      const shipped = Number(item.shipped_qty ?? item.requested_qty ?? 0);
                      const got = Number(draft.received[item.id] ?? 0);
                      const diff = got - shipped;
                      return (
                        <div key={item.id} className="grid gap-2 rounded-md border p-3 sm:grid-cols-[1fr_100px_100px_160px] sm:items-end">
                          <div>
                            <p className="text-sm font-medium">{item.product?.name || 'Produto'}</p>
                            <p className="text-xs text-muted-foreground">{item.product?.code}</p>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px]">Enviado</Label>
                            <Input value={shipped} readOnly className="bg-muted" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px]">Recebido</Label>
                            <Input
                              type="number"
                              min={0}
                              value={got}
                              onChange={(e) =>
                                setDraft(order.id, { received: { ...draft.received, [item.id]: Number(e.target.value) } }, draft)
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px]">
                              {diff === 0 ? 'Sem divergência' : `Divergência: ${diff > 0 ? '+' : ''}${diff}`}
                            </Label>
                            <Select
                              value={draft.reasons[item.id] || ''}
                              onValueChange={(v) =>
                                setDraft(order.id, { reasons: { ...draft.reasons, [item.id]: v as DivergenceReason } }, draft)
                              }
                              disabled={diff === 0}
                            >
                              <SelectTrigger><SelectValue placeholder={diff === 0 ? '—' : 'Motivo'} /></SelectTrigger>
                              <SelectContent>
                                {REASONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Textarea
                    placeholder="Observações da conferência (opcional)"
                    value={draft.notes}
                    onChange={(e) => setDraft(order.id, { notes: e.target.value }, draft)}
                    className="h-16"
                  />

                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => receiveAll(order)}>Receber tudo</Button>
                    <Button onClick={() => confirm(order)} disabled={isAdvancing}>
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Confirmar recebimento
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
