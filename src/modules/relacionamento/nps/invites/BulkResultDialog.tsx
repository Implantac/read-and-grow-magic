import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/ui/base/dialog';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { CheckCircle2, XCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';
import type { BulkResult } from './parts';

interface BulkResultDialogProps {
  bulkResult: BulkResult;
  onClose: () => void;
}

export function BulkResultDialog({ bulkResult, onClose }: BulkResultDialogProps) {
  return (
    <Dialog open={!!bulkResult} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{bulkResult?.title ?? 'Resultado'}</DialogTitle>
        </DialogHeader>
        {bulkResult && (() => {
          const ok = bulkResult.items.filter((r) => r.ok).length;
          const fail = bulkResult.items.length - ok;
          return (
            <div className="space-y-3">
              <div className="flex gap-2 text-sm">
                <Badge className="bg-green-500/20 text-green-500 border-green-500/30" variant="outline">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> {ok} sucesso(s)
                </Badge>
                {fail > 0 && (
                  <Badge className="text-red-500 border-red-500/40" variant="outline">
                    <XCircle className="h-3.5 w-3.5 mr-1" /> {fail} falha(s)
                  </Badge>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto border rounded divide-y divide-border">
                {bulkResult.items.map((r) => (
                  <div key={r.id} className="flex items-start gap-2 p-2 text-sm">
                    {r.ok
                      ? <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      : <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{r.name}</div>
                      {!r.ok && r.error && (
                        <div className="text-xs text-red-500 truncate" title={r.error}>{r.error}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => {
            if (!bulkResult) return;
            const txt = bulkResult.items.map((r) => `${r.ok ? 'OK' : 'FALHA'}\t${r.name}${r.error ? `\t${r.error}` : ''}`).join('\n');
            navigator.clipboard.writeText(txt);
            toast.success('Resultado copiado');
          }}><Copy className="h-3.5 w-3.5 mr-2" /> Copiar</Button>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
