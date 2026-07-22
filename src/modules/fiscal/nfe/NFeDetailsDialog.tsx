import { Download, Printer } from 'lucide-react';
import { Button } from '@/ui/base/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/ui/base/dialog';
import { Separator } from '@/ui/base/separator';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { AuditTrailPanel } from '@/shared/components/AuditTrailPanel';
import type { NFe } from '@/types/fiscal';

export function NFeDetailsDialog({
  open, onOpenChange, nfe, formatCurrency, formatDate, onPrint, onDownloadXML,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  nfe: NFe | null;
  formatCurrency: (n: number) => string;
  formatDate: (s: string) => string;
  onPrint: (n: NFe) => void;
  onDownloadXML: (n: NFe) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detalhes da NF-e {nfe?.number}</DialogTitle>
          <DialogDescription>Informações completas da nota fiscal eletrônica</DialogDescription>
        </DialogHeader>
        {nfe && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <StatusBadge status={nfe.status} type="nfe" />
              {nfe.protocol && (
                <span className="text-sm text-muted-foreground">Protocolo: {nfe.protocol}</span>
              )}
            </div>

            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">Chave de Acesso</p>
              <p className="font-mono text-sm break-all">{nfe.accessKey}</p>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Destinatário</p>
                <p className="font-medium">{nfe.clientName}</p>
                <p className="text-sm">{nfe.clientDocument}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data de Emissão</p>
                <p className="font-medium">{formatDate(nfe.issueDate)}</p>
                {nfe.authorizationDate && (
                  <>
                    <p className="text-sm text-muted-foreground mt-2">Data de Autorização</p>
                    <p className="text-sm">{formatDate(nfe.authorizationDate)}</p>
                  </>
                )}
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Subtotal</p>
                <p className="font-medium">{formatCurrency(nfe.subtotal)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Desconto</p>
                <p className="font-medium text-destructive">-{formatCurrency(nfe.discount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Frete</p>
                <p className="font-medium">{formatCurrency(nfe.shipping)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(nfe.total)}</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">Impostos</p>
              <div className="grid gap-4 sm:grid-cols-4">
                {(['icms', 'ipi', 'pis', 'cofins'] as const).map((k) => (
                  <div key={k} className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">{k.toUpperCase()}</p>
                    <p className="font-medium">{formatCurrency((nfe as any)[k])}</p>
                  </div>
                ))}
              </div>
            </div>

            {nfe.cancellationDate && (
              <>
                <Separator />
                <div className="rounded-lg bg-destructive/10 p-4">
                  <p className="font-medium text-destructive">Nota Cancelada</p>
                  <p className="text-sm text-muted-foreground mt-1">Data: {formatDate(nfe.cancellationDate)}</p>
                  {nfe.cancellationReason && (
                    <p className="text-sm mt-2">Motivo: {nfe.cancellationReason}</p>
                  )}
                </div>
              </>
            )}

            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">Trilha de auditoria</p>
              <AuditTrailPanel entityName="nfe" entityId={nfe.id} limit={100} height={280} />
            </div>

            <div className="flex justify-end gap-2">
              {nfe.status === 'authorized' && (
                <>
                  <Button variant="outline" onClick={() => onPrint(nfe)}>
                    <Printer className="mr-2 h-4 w-4" />Imprimir DANFE
                  </Button>
                  <Button variant="outline" onClick={() => onDownloadXML(nfe)}>
                    <Download className="mr-2 h-4 w-4" />Download XML
                  </Button>
                </>
              )}
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Fechar</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
