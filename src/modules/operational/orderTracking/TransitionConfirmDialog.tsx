import { Button } from '@/ui/base/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/ui/base/dialog';
import { Textarea } from '@/ui/base/textarea';

interface Props {
  open: boolean;
  targetStatus: string | undefined;
  observation: string;
  setObservation: (v: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  disabled: boolean;
}

export function TransitionConfirmDialog({
  open,
  targetStatus,
  observation,
  setObservation,
  onCancel,
  onConfirm,
  disabled,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{targetStatus === 'blocked' ? 'Bloquear Pedido' : 'Cancelar Pedido'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {targetStatus === 'blocked' ? 'Informe o motivo do bloqueio:' : 'Informe o motivo do cancelamento:'}
          </p>
          <Textarea
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            placeholder="Motivo..."
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Voltar</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={!observation.trim() || disabled}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
