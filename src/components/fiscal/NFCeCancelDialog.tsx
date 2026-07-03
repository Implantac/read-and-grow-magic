import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/ui/base/dialog';
import { Button } from '@/ui/base/button';
import { Label } from '@/ui/base/label';
import { Textarea } from '@/ui/base/textarea';
import { AlertTriangle } from 'lucide-react';
import type { NFCe } from '@/types/fiscal';

interface Props {
  nfce: NFCe | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (reason: string) => Promise<boolean>;
}

export function NFCeCancelDialog({ nfce, open, onOpenChange, onConfirm }: Props) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const min = 15;

  const handle = async () => {
    setSaving(true);
    const ok = await onConfirm(reason);
    setSaving(false);
    if (ok) {
      setReason('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!saving) onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" /> Cancelar NFC-e {nfce?.number}
          </DialogTitle>
          <DialogDescription>
            Informe o motivo do cancelamento. A justificativa é obrigatória e deve ter no mínimo {min} caracteres (regra SEFAZ).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="cancel-reason">Motivo</Label>
          <Textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="Ex.: Cliente desistiu da compra, item cadastrado incorretamente..."
          />
          <p className={`text-xs ${reason.trim().length >= min ? 'text-muted-foreground' : 'text-destructive'}`}>
            {reason.trim().length}/{min} caracteres mínimos
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" disabled={saving} onClick={() => onOpenChange(false)}>Voltar</Button>
          <Button
            variant="destructive"
            disabled={saving || reason.trim().length < min}
            onClick={handle}
          >
            {saving ? 'Cancelando...' : 'Confirmar cancelamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
