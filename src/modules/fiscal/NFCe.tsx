import { useState } from 'react';
import { toastSuccess } from '@/lib/toastHelpers';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatBRL, formatDate } from '@/lib/formatters';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Eye,
  Printer,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Undo2,
  CreditCard,
  Banknote,
  QrCode,
} from 'lucide-react';

import { ExportButton } from '@/shared/components/ExportButton';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/base/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/ui/base/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/base/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/base/select';
import { Badge } from '@/ui/base/badge';
import { Separator } from '@/ui/base/separator';
import { useNFCe } from '@/hooks/fiscal/useNFCe';
import { PDVDialog } from '@/components/fiscal/PDVDialog';
import { NFCeCancelDialog } from '@/components/fiscal/NFCeCancelDialog';
import { NFCeReturnDialog } from '@/components/fiscal/NFCeReturnDialog';
import type { NFCe } from '@/types/fiscal';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';


const statusConfig: Record<string, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  authorized: { color: 'bg-success/10 text-success', icon: CheckCircle },
  cancelled: { color: 'bg-muted text-muted-foreground', icon: XCircle },
  contingency: { color: 'bg-warning/10 text-warning', icon: AlertTriangle },
};

const paymentLabels: Record<string, string> = {
  cash: 'Dinheiro',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  pix: 'PIX',
  voucher: 'Vale',
  multiple: 'Múltiplo',
};

const paymentIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  cash: Banknote,
  credit_card: CreditCard,
  debit_card: CreditCard,
  pix: QrCode,
  voucher: Receipt,
  multiple: CreditCard,
};

export default function NFCePage() {
  const { nfces, loading, cancel: cancelNFCe, emit, createReturn } = useNFCe();
  const [pdvOpen, setPdvOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [terminalFilter, setTerminalFilter] = useState<string>('all');
  const [selectedNFCe, setSelectedNFCe] = useState<NFCe | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<NFCe | null>(null);
  const [returnTarget, setReturnTarget] = useState<NFCe | null>(null);


  const terminals = [...new Set(nfces.map((n) => n.terminalId))];

  const filteredNFCes = nfces.filter((nfce) => {
    const matchesSearch =
      nfce.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (nfce.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      nfce.accessKey.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || nfce.status === statusFilter;
    const matchesTerminal = terminalFilter === 'all' || nfce.terminalId === terminalFilter;
    return matchesSearch && matchesStatus && matchesTerminal;
  });

  const formatCurrency = (value: number) => {
    return formatBRL(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const handleViewDetails = (nfce: NFCe) => {
    setSelectedNFCe(nfce);
    setDetailsOpen(true);
  };

  const handlePrint = (nfce: NFCe) => {
    toastSuccess('Imprimindo Cupom', `Cupom fiscal ${nfce.number} enviado para impressão`);
  };

  const handleCancel = (nfce: NFCe) => {
    setCancelTarget(nfce);
  };

  const handleReturn = (nfce: NFCe) => {
    setReturnTarget(nfce);
  };


  const handleReprint = (nfce: NFCe) => {
    toastSuccess('2ª Via', `Reimpressão do cupom ${nfce.number} enviada`);
  };

  const renderStatusBadge = (status: string) => {
    const config = statusConfig[status];
    const Icon = config?.icon || Receipt;
    const labels: Record<string, string> = {
      authorized: 'Autorizada',
      cancelled: 'Cancelada',
      contingency: 'Contingência',
    };
    return (
      <Badge className={`${config?.color} gap-1`}>
        <Icon className="h-3 w-3" />
        {labels[status] || status}
      </Badge>
    );
  };

  const renderPaymentBadge = (method: string) => {
    const Icon = paymentIcons[method] || CreditCard;
    return (
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span>{paymentLabels[method] || method}</span>
      </div>
    );
  };

  return (
    <PageContainer>
      <PageHeader title="NFC-e - Nota Fiscal de Consumidor" description="Gerencie suas notas fiscais de consumidor eletrônicas">
        <ExportButton
          data={filteredNFCes as unknown as Record<string, unknown>[]}
          columns={[
            { key: 'number', label: 'Número' },
            { key: 'customerName', label: 'Cliente' },
            { key: 'totalValue', label: 'Valor', format: (v) => formatBRL(Number(v)) },
            { key: 'paymentMethod', label: 'Pagamento' },
            { key: 'status', label: 'Status' },
            { key: 'issuedAt', label: 'Emissão', format: (v) => formatDate(v as string) },
            { key: 'terminalId', label: 'Terminal' },
          ]}
          filename="nfce"
        />
        <Button className="gap-2" onClick={() => setPdvOpen(true)}>
          <Plus className="h-4 w-4" />
          Nova Venda PDV
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="NFC-e Emitidas" value={String(nfces.length)} icon={<Receipt className="h-5 w-5" />} accentColor="primary" index={0} />
        <KPICard title="Ticket Médio" value={formatCurrency(nfces.length > 0 ? nfces.reduce((s, n) => s + n.total, 0) / nfces.length : 0)} icon={<CreditCard className="h-5 w-5" />} accentColor="info" index={1} />
        <KPICard title="Canceladas" value={String(nfces.filter(n => n.status === 'cancelled').length)} icon={<XCircle className="h-5 w-5" />} accentColor="danger" index={2} />
        <KPICard title="Taxa Aprovação" value={`${nfces.length > 0 ? (((nfces.length - nfces.filter(n => n.status === 'cancelled').length) / nfces.length) * 100).toFixed(1) : '0.0'}%`} icon={<CheckCircle className="h-5 w-5" />} accentColor="success" index={3} />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, cliente ou chave de acesso..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="authorized">Autorizada</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
                <SelectItem value="contingency">Contingência</SelectItem>
              </SelectContent>
            </Select>
            <Select value={terminalFilter} onValueChange={setTerminalFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Terminal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos PDVs</SelectItem>
                {terminals.map((terminal) => (
                  <SelectItem key={terminal} value={terminal}>
                    {terminal}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Terminal</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNFCes.map((nfce) => (
                <TableRow key={nfce.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{nfce.number}</div>
                      <div className="text-xs text-muted-foreground">Série {nfce.series}</div>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(nfce.issueDate)}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{nfce.terminalId}</div>
                      <div className="text-xs text-muted-foreground">{nfce.operatorName}</div>
                    </div>
                  </TableCell>
                  <TableCell>{renderPaymentBadge(nfce.paymentMethod)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(nfce.total)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {renderStatusBadge(nfce.status)}
                      {nfce.returnStatus === 'partial' && (
                        <Badge variant="outline" className="border-warning/40 text-warning gap-1">
                          <Undo2 className="h-3 w-3" /> Dev. parcial
                        </Badge>
                      )}
                      {nfce.returnStatus === 'full' && (
                        <Badge variant="outline" className="border-destructive/40 text-destructive gap-1">
                          <Undo2 className="h-3 w-3" /> Devolvida
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(nfce)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </DropdownMenuItem>
                        {nfce.status === 'authorized' && (
                          <>
                            <DropdownMenuItem onClick={() => handleReprint(nfce)}>
                              <Printer className="mr-2 h-4 w-4" />
                              Reimprimir Cupom
                            </DropdownMenuItem>
                            {nfce.returnStatus !== 'full' && (
                              <DropdownMenuItem onClick={() => handleReturn(nfce)}>
                                <Undo2 className="mr-2 h-4 w-4" />
                                Devolver itens
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleCancel(nfce)}
                              className="text-destructive"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancelar NFC-e
                            </DropdownMenuItem>
                          </>
                        )}

                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredNFCes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    Nenhuma NFC-e encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da NFC-e {selectedNFCe?.number}</DialogTitle>
            <DialogDescription>
              Cupom fiscal eletrônico
            </DialogDescription>
          </DialogHeader>
          {selectedNFCe && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                {renderStatusBadge(selectedNFCe.status)}
                {selectedNFCe.protocol && (
                  <span className="text-sm text-muted-foreground">
                    Protocolo: {selectedNFCe.protocol}
                  </span>
                )}
              </div>

              {/* Access Key */}
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Chave de Acesso</p>
                <p className="font-mono text-sm break-all">{selectedNFCe.accessKey}</p>
              </div>

              <Separator />

              {/* Transaction Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Data/Hora</p>
                  <p className="font-medium">{formatDate(selectedNFCe.issueDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Terminal / Operador</p>
                  <p className="font-medium">{selectedNFCe.terminalId}</p>
                  <p className="text-sm text-muted-foreground">{selectedNFCe.operatorName}</p>
                </div>
              </div>

              {/* Customer */}
              {selectedNFCe.customerName && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente Identificado</p>
                    <p className="font-medium">{selectedNFCe.customerName}</p>
                    <p className="text-sm">{selectedNFCe.customerDocument}</p>
                  </div>
                </>
              )}

              <Separator />

              {/* Items */}
              {selectedNFCe.items.length > 0 && (
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
                        {selectedNFCe.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{item.productName}</div>
                                <div className="text-xs text-muted-foreground">{item.productCode}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <Separator />

              {/* Payment */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Subtotal</p>
                  <p className="font-medium">{formatCurrency(selectedNFCe.subtotal)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Desconto</p>
                  <p className="font-medium text-destructive">-{formatCurrency(selectedNFCe.discount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-xl font-bold text-primary">{formatCurrency(selectedNFCe.total)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Forma de Pagamento</p>
                  {renderPaymentBadge(selectedNFCe.paymentMethod)}
                </div>
              </div>

              {selectedNFCe.change > 0 && (
                <div className="rounded-lg bg-muted p-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Valor Pago</span>
                    <span className="font-medium">{formatCurrency(selectedNFCe.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Troco</span>
                    <span className="font-medium">{formatCurrency(selectedNFCe.change)}</span>
                  </div>
                </div>
              )}

              {/* Cancellation Info */}
              {selectedNFCe.cancellationDate && (
                <>
                  <Separator />
                  <div className="rounded-lg bg-destructive/10 p-4">
                    <p className="font-medium text-destructive">Cupom Cancelado</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Data: {formatDate(selectedNFCe.cancellationDate)}
                    </p>
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2">
                {selectedNFCe.status === 'authorized' && (
                  <Button variant="outline" onClick={() => handlePrint(selectedNFCe)}>
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir Cupom
                  </Button>
                )}
                <Button variant="ghost" onClick={() => setDetailsOpen(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PDV Dialog */}
      <PDVDialog open={pdvOpen} onOpenChange={setPdvOpen} onEmit={emit} />

      {/* Cancel Dialog */}
      <NFCeCancelDialog
        nfce={cancelTarget}
        open={!!cancelTarget}
        onOpenChange={(v) => { if (!v) setCancelTarget(null); }}
        onConfirm={async (reason) => {
          if (!cancelTarget) return false;
          return cancelNFCe(cancelTarget.id, reason);
        }}
      />

      {/* Return Dialog */}
      <NFCeReturnDialog
        nfce={returnTarget}
        open={!!returnTarget}
        onOpenChange={(v) => { if (!v) setReturnTarget(null); }}
        onConfirm={async ({ reason, refundMethod, items }) => {
          if (!returnTarget) return null;
          return createReturn({
            nfceId: returnTarget.id,
            reason,
            refundMethod,
            items,
            terminalId: returnTarget.terminalId,
            operatorName: returnTarget.operatorName,
          });
        }}
      />
    </PageContainer>
  );

}
