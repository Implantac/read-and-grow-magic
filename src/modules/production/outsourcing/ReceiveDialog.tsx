import { useState } from 'react';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/ui/base/dialog';
import type { OutsourcingOrderRow } from '@/hooks/production/useOutsourcingOrders';

export function ReceiveDialog({ order, onClose, onReceive }: {
  order: OutsourcingOrderRow;
  onClose: () => void;
  onReceive: (o: OutsourcingOrderRow, returned: number, rejected: number) => void;
}) {
  const [returnedQty, setReturnedQty] = useState(order.quantity_sent);
  const [rejectedQty, setRejectedQty] = useState(0);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Receber OS {order.order_number}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Fornecedor: <strong>{order.supplier_name}</strong></p>
          <p className="text-sm text-muted-foreground">Quantidade enviada: <strong>{order.quantity_sent}</strong></p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Qtde Retornada</Label>
              <Input type="number" value={returnedQty} onChange={e => setReturnedQty(+e.target.value)} />
            </div>
            <div>
              <Label>Qtde Rejeitada</Label>
              <Input type="number" value={rejectedQty} onChange={e => setRejectedQty(+e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onReceive(order, returnedQty, rejectedQty)}>Confirmar Recebimento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
