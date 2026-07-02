import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/ui/base/dialog';
import { Button } from '@/ui/base/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rejectionCode?: string | null;
  rejectionReason?: string | null;
  suggestion?: string | null;
  onRetry?: () => void;
  onEdit?: () => void;
}

/**
 * Interpreta a rejeição SEFAZ e humaniza a CTA.
 * Ex.: 539 → duplicidade; 204 → chave duplicada; 233 → certificado expirado.
 */
const HUMAN_HINTS: Record<string, string> = {
  '204': 'Chave de acesso já autorizada. Consulte a NF-e existente antes de reenviar.',
  '233': 'Certificado digital expirado. Renove e reenvie a nota.',
  '539': 'Duplicidade de NF-e detectada pela SEFAZ. Ajuste a numeração antes de reenviar.',
  '610': 'Valor total dos produtos difere da soma dos itens. Recalcule antes de retransmitir.',
};

export function NfeRejectionDialog({ open, onOpenChange, rejectionCode, rejectionReason, suggestion, onRetry, onEdit }: Props) {
  const hint = rejectionCode ? HUMAN_HINTS[rejectionCode] : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-destructive/15 p-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>NF-e rejeitada pela SEFAZ</DialogTitle>
              <DialogDescription>
                {rejectionCode ? `Código ${rejectionCode}` : 'Detalhes da rejeição'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          {rejectionReason && (
            <div className="rounded-md border border-border/60 bg-muted/30 p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Motivo</div>
              <div>{rejectionReason}</div>
            </div>
          )}
          {(hint || suggestion) && (
            <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
              <div className="text-xs uppercase tracking-wide text-primary mb-1">Como resolver</div>
              <div>{suggestion ?? hint}</div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {onEdit && (
            <Button variant="outline" onClick={onEdit}>
              Editar pedido
            </Button>
          )}
          {onRetry && (
            <Button onClick={onRetry}>
              Retransmitir
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
