import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/base/dialog';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { Label } from '@/ui/base/label';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatBRL } from '@/lib/formatters';
import { movementTypeConfig } from '@/config/inventory';
import type { MovementType, StockMovement } from '@/types/inventory';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  movement: StockMovement | null;
}

const typeBadge = (type: MovementType) => {
  const c = movementTypeConfig.find((t) => t.value === type);
  return <Badge className={c?.color}>{c?.label}</Badge>;
};

const fmtDate = (d: string) => format(new Date(d), 'dd/MM/yyyy HH:mm', { locale: ptBR });

export function MovementViewDialog({ open, onOpenChange, movement }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detalhes da Movimentação</DialogTitle>
          <DialogDescription>{movement?.documentNumber}</DialogDescription>
        </DialogHeader>
        {movement && (
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Documento</Label>
                <p className="font-medium">{movement.documentNumber}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Data</Label>
                <p className="font-medium">{fmtDate(movement.createdAt)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Produto</Label>
                <p className="font-medium">{movement.productCode}</p>
                <p className="text-sm text-muted-foreground">{movement.productName}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Tipo</Label>
                <div className="mt-1">{typeBadge(movement.type)}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Quantidade</Label>
                <p
                  className={`font-medium ${
                    movement.direction === 'in' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {movement.direction === 'in' ? '+' : '-'}
                  {movement.quantity}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Custo Unitário</Label>
                <p className="font-medium">{formatBRL(movement.unitCost)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Custo Total</Label>
                <p className="font-medium">{formatBRL(movement.totalCost)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Operador</Label>
                <p className="font-medium">{movement.operator}</p>
              </div>
              {movement.batch && (
                <div>
                  <Label className="text-muted-foreground">Lote</Label>
                  <p className="font-medium">{movement.batch}</p>
                </div>
              )}
              {movement.fromWarehouse && (
                <div>
                  <Label className="text-muted-foreground">Origem</Label>
                  <p className="font-medium">{movement.fromWarehouse}</p>
                </div>
              )}
              {movement.toWarehouse && (
                <div>
                  <Label className="text-muted-foreground">Destino</Label>
                  <p className="font-medium">{movement.toWarehouse}</p>
                </div>
              )}
              {movement.reference && (
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Referência</Label>
                  <p className="font-medium">{movement.reference}</p>
                </div>
              )}
              {movement.notes && (
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Observações</Label>
                  <p className="font-medium">{movement.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
