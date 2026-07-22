import {
  Download, FileText, Send, XCircle, Eye, Printer, MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/ui/base/button';
import { Card, CardContent } from '@/ui/base/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/ui/base/dropdown-menu';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { EmptyState } from '@/shared/components/EmptyState';
import type { NFe } from '@/types/fiscal';

export function NFeTable({
  rows, formatCurrency, formatDate, onView, onTransmit, onPrint, onDownloadXML, onCancel,
}: {
  rows: NFe[];
  formatCurrency: (n: number) => string;
  formatDate: (s: string) => string;
  onView: (n: NFe) => void;
  onTransmit: (n: NFe) => void;
  onPrint: (n: NFe) => void;
  onDownloadXML: (n: NFe) => void;
  onCancel: (n: NFe) => void;
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Data Emissão</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((nfe) => (
              <TableRow key={nfe.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{nfe.number}</div>
                    <div className="text-xs text-muted-foreground">Série {nfe.series}</div>
                  </div>
                </TableCell>
                <TableCell>{formatDate(nfe.issueDate)}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{nfe.clientName}</div>
                    <div className="text-xs text-muted-foreground">{nfe.clientDocument}</div>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{formatCurrency(nfe.total)}</TableCell>
                <TableCell><StatusBadge status={nfe.status} type="nfe" /></TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(nfe)}>
                        <Eye className="mr-2 h-4 w-4" />Visualizar
                      </DropdownMenuItem>
                      {nfe.status === 'draft' && (
                        <DropdownMenuItem onClick={() => onTransmit(nfe)}>
                          <Send className="mr-2 h-4 w-4" />Enviar p/ Transmissão
                        </DropdownMenuItem>
                      )}
                      {nfe.status === 'pending' && (
                        <DropdownMenuItem onClick={() => onTransmit(nfe)}>
                          <Send className="mr-2 h-4 w-4" />Autorizar na SEFAZ
                        </DropdownMenuItem>
                      )}
                      {nfe.status === 'authorized' && (
                        <>
                          <DropdownMenuItem onClick={() => onPrint(nfe)}>
                            <Printer className="mr-2 h-4 w-4" />Imprimir DANFE
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDownloadXML(nfe)}>
                            <Download className="mr-2 h-4 w-4" />Download XML
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onCancel(nfe)} className="text-destructive">
                            <XCircle className="mr-2 h-4 w-4" />Cancelar NF-e
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  <EmptyState icon={FileText} title="Nenhuma NF-e encontrada" description="Emita notas fiscais eletrônicas a partir de pedidos aprovados." />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
