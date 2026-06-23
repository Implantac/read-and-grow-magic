import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/base/dialog';
import type { ClientInsight } from '@/hooks/commercial/useSalesIntelligence';

interface SalesScriptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scriptClient: ClientInsight | null;
  salesScript: any;
}

export function SalesScriptDialog({ open, onOpenChange, scriptClient, salesScript }: SalesScriptDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>📋 Script de Venda — {scriptClient?.clientName}</DialogTitle>
        </DialogHeader>
        {salesScript ? (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm font-bold">{salesScript.approach}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">ABERTURA</p>
              <p className="text-sm italic">&ldquo;{salesScript.openingLine}&rdquo;</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">PONTOS-CHAVE</p>
              <ul className="space-y-1">
                {salesScript.keyPoints.map((p: string, i: number) => (
                  <li key={i} className="text-sm flex items-start gap-2"><span className="text-primary">•</span>{p}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">OBJEÇÕES</p>
              <ul className="space-y-1">
                {salesScript.objectionHandlers.map((o: string, i: number) => (
                  <li key={i} className="text-xs bg-muted/50 p-2 rounded">{o}</li>
                ))}
              </ul>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
              <p className="text-xs font-medium text-muted-foreground mb-1">FECHAMENTO</p>
              <p className="text-sm font-medium">{salesScript.closingTechnique}</p>
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">Selecione um cliente</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
