import { XCircle } from 'lucide-react';
import { Button } from '@/ui/base/button';
import { Textarea } from '@/ui/base/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/ui/base/dialog';
import type { NFe } from '@/types/fiscal';

export function CancelNFeDialog({
  open, onOpenChange, nfe, reason, setReason, onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  nfe: NFe | null;
  reason: string;
  setReason: (v: string) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar NF-e {nfe?.number}</DialogTitle>
          <DialogDescription>Esta ação é irreversível. Informe o motivo do cancelamento.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="Motivo do cancelamento..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Voltar</Button>
            <Button variant="destructive" onClick={onConfirm} disabled={!reason.trim()}>
              <XCircle className="mr-2 h-4 w-4" />Confirmar Cancelamento
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
