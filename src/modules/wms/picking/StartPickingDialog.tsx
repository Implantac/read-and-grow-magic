import { User, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/ui/base/dialog';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operator: string;
  onOperatorChange: (v: string) => void;
  onConfirm: () => void;
}

export function StartPickingDialog({ open, onOpenChange, operator, onOperatorChange, onConfirm }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Iniciar Separação</DialogTitle>
          <DialogDescription>Atribua um operador para iniciar a coleta dos itens.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label>Operador Responsável</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={operator} onChange={(e) => onOperatorChange(e.target.value)} placeholder="Nome do operador" className="pl-9" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onConfirm} disabled={!operator.trim()}>
            <Zap className="h-4 w-4 mr-2" /> Iniciar Agora
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
