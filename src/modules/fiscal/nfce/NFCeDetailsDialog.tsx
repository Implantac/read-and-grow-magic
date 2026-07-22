import { Printer } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/base/dialog';
import { Button } from '@/ui/base/button';
import { Separator } from '@/ui/base/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { formatBRL } from '@/lib/formatters';
import type { NFCe } from '@/types/fiscal';
import { StatusBadge, PaymentBadge } from './constants';

const fmtDate = (v: string) => format(new Date(v), 'dd/MM/yyyy HH:mm', { locale: ptBR });

type Props = {
  nfce: NFCe | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPrint: (n: NFCe) => void;
};

export function NFCeDetailsDialog({ nfce, open, onOpenChange, onPrint }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes da NFC-e {nfce?.number}</DialogTitle>
          <DialogDescription>Cupom fiscal eletrônico</DialogDescription>
        </DialogHeader>
        {nfce && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <StatusBadge status={nfce.status} />
              {nfce.protocol && (
                <span className="text-sm text-muted-foreground">Protocolo: {nfce.protocol}</span>
              )}
            </div>

            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">Chave de Acesso</p>
              <p className="font-mono text-sm break-all">{nfce.accessKey}</p>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Data/Hora</p>
                <p className="font-medium">{fmtDate(nfce.issueDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Terminal / Operador</p>
                <p className="font-medium">{nfce.terminalId}</p>
                <p className="text-sm text-muted-foreground">{nfce.operatorName}</p>
              </div>
            </div>

            {nfce.customerName && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Cliente Identificado</p>
                  <p className="font-medium">{nfce.customerName}</p>
                  <p className="text-sm">{nfce.customerDocument}</p>
                </div>
              </>
            )}

            <Separator />

            {nfce.items.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-3">Itens</p>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-right">Qtd</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {nfce.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.productName}</div>
                              <div className="text-xs text-muted-foreground">{item.productCode}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatBRL(item.unitPrice)}</TableCell>
                          <TableCell className="text-right font-medium">{formatBRL(item.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Subtotal</p>
                <p className="font-medium">{formatBRL(nfce.subtotal)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Desconto</p>
                <p className="font-medium text-destructive">-{formatBRL(nfce.discount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold text-primary">{formatBRL(nfce.total)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Forma de Pagamento</p>
                <PaymentBadge method={nfce.paymentMethod} />
              </div>
            </div>

            {nfce.change > 0 && (
              <div className="rounded-lg bg-muted p-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Valor Pago</span>
                  <span className="font-medium">{formatBRL(nfce.amountPaid)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Troco</span>
                  <span className="font-medium">{formatBRL(nfce.change)}</span>
                </div>
              </div>
            )}

            {nfce.cancellationDate && (
              <>
                <Separator />
                <div className="rounded-lg bg-destructive/10 p-4">
                  <p className="font-medium text-destructive">Cupom Cancelado</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Data: {fmtDate(nfce.cancellationDate)}
                  </p>
                </div>
              </>
            )}

            <div className="flex justify-end gap-2">
              {nfce.status === 'authorized' && (
                <Button variant="outline" onClick={() => onPrint(nfce)}>
                  <Printer className="mr-2 h-4 w-4" /> Imprimir Cupom
                </Button>
              )}
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
