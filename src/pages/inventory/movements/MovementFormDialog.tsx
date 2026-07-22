import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/base/dialog';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Textarea } from '@/ui/base/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/base/select';
import { movementTypeConfig } from '@/config/inventory';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function MovementFormDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Movimentação</DialogTitle>
          <DialogDescription>Registrar entrada ou saída de estoque</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>Tipo de Movimentação *</Label>
            <Select defaultValue="purchase">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {movementTypeConfig.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Produto *</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o produto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="empty">Nenhum produto cadastrado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade *</Label>
              <Input id="quantity" type="number" min="1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitCost">Custo Unitário *</Label>
              <Input id="unitCost" type="number" step="0.01" min="0" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="batch">Lote</Label>
            <Input id="batch" placeholder="LOT-XXXX" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reference">Referência</Label>
            <Input id="reference" placeholder="NF, PV, OP..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" placeholder="Informações adicionais..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => onOpenChange(false)}>Registrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
