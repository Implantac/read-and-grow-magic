import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Download,
  FileText,
  Plus,
  Search,
  Filter,
  Send,
  XCircle,
  Eye,
  Printer,
  MoreHorizontal,
  CheckCircle,
  Clock,
  AlertTriangle,
  Ban,
} from 'lucide-react';
import { ExportButton } from '@/components/shared/ExportButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useNFe } from '@/hooks/useNFe';
import { nfeStatusLabels } from '@/config/fiscal';
import type { NFe } from '@/types/fiscal';

const statusConfig: Record<string, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  draft: { color: 'bg-muted text-muted-foreground', icon: FileText },
  pending: { color: 'bg-warning/10 text-warning', icon: Clock },
  authorized: { color: 'bg-success/10 text-success', icon: CheckCircle },
  rejected: { color: 'bg-destructive/10 text-destructive', icon: AlertTriangle },
  cancelled: { color: 'bg-muted text-muted-foreground', icon: Ban },
  denied: { color: 'bg-destructive/10 text-destructive', icon: XCircle },
};

export default function NFePage() {
  const { toast } = useToast();
  const { nfes, loading, transmit, cancel, sendToPending } = useNFe();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedNFe, setSelectedNFe] = useState<NFe | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [nfeToCancel, setNfeToCancel] = useState<NFe | null>(null);

  const filteredNFes = nfes.filter((nfe) => {
    const matchesSearch =
      nfe.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nfe.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nfe.accessKey.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || nfe.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const handleViewDetails = (nfe: NFe) => {
    setSelectedNFe(nfe);
    setDetailsOpen(true);
  };

  const handleTransmit = async (nfe: NFe) => {
    if (nfe.status === 'draft') {
      await sendToPending(nfe.id);
    } else if (nfe.status === 'pending') {
      await transmit(nfe.id);
    }
  };

  const handleCancel = (nfe: NFe) => {
    setNfeToCancel(nfe);
    setCancelReason('');
    setCancelDialogOpen(true);
  };

  const confirmCancel = async () => {
    if (!nfeToCancel || !cancelReason.trim()) return;
    await cancel(nfeToCancel.id, cancelReason);
    setCancelDialogOpen(false);
    setNfeToCancel(null);
  };

  const handlePrint = (nfe: NFe) => {
    toast({
      title: 'Imprimindo DANFE',
      description: `DANFE da NF-e ${nfe.number} enviada para impressão`,
    });
  };

  const handleDownloadXML = (nfe: NFe) => {
    toast({
      title: 'Download XML',
      description: `XML da NF-e ${nfe.number} baixado com sucesso`,
    });
  };

  const renderStatusBadge = (status: string) => {
    const config = statusConfig[status];
    const Icon = config?.icon || FileText;
    return (
      <Badge className={`${config?.color} gap-1`}>
        <Icon className="h-3 w-3" />
        {nfeStatusLabels[status] || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">NF-e - Nota Fiscal Eletrônica</h1>
          <p className="text-muted-foreground">
            Gerencie suas notas fiscais eletrônicas
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            data={filteredNFes as unknown as Record<string, unknown>[]}
            columns={[
              { key: 'number', label: 'Número' },
              { key: 'series', label: 'Série' },
              { key: 'clientName', label: 'Destinatário' },
              { key: 'totalValue', label: 'Valor', format: (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v)) },
              { key: 'status', label: 'Status' },
              { key: 'issuedAt', label: 'Emissão', format: (v) => new Date(v as string).toLocaleDateString('pt-BR') },
            ]}
            filename="nfe"
          />
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova NF-e
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NF-e Emitidas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nfes.filter(n => n.status === 'authorized').length}</div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Faturado</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(nfes.filter(n => n.status === 'authorized').reduce((s, n) => s + n.total, 0))}</div>
            <p className="text-xs text-muted-foreground">Em NF-e autorizadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nfes.filter(n => n.status === 'cancelled').length}</div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impostos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(nfes.reduce((s, n) => s + n.icms + n.ipi + n.pis + n.cofins, 0))}</div>
            <p className="text-xs text-muted-foreground">ICMS + IPI + PIS + COFINS</p>
          </CardContent>
        </Card>
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
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="authorized">Autorizada</SelectItem>
                <SelectItem value="rejected">Rejeitada</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
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
                <TableHead>Data Emissão</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNFes.map((nfe) => (
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
                  <TableCell>{renderStatusBadge(nfe.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(nfe)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </DropdownMenuItem>
                        {nfe.status === 'draft' && (
                          <DropdownMenuItem onClick={() => handleTransmit(nfe)}>
                            <Send className="mr-2 h-4 w-4" />
                            Enviar p/ Transmissão
                          </DropdownMenuItem>
                        )}
                        {nfe.status === 'pending' && (
                          <DropdownMenuItem onClick={() => handleTransmit(nfe)}>
                            <Send className="mr-2 h-4 w-4" />
                            Autorizar na SEFAZ
                          </DropdownMenuItem>
                        )}
                        {nfe.status === 'authorized' && (
                          <>
                            <DropdownMenuItem onClick={() => handlePrint(nfe)}>
                              <Printer className="mr-2 h-4 w-4" />
                              Imprimir DANFE
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadXML(nfe)}>
                              <Download className="mr-2 h-4 w-4" />
                              Download XML
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleCancel(nfe)}
                              className="text-destructive"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancelar NF-e
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredNFes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    Nenhuma NF-e encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes da NF-e {selectedNFe?.number}</DialogTitle>
            <DialogDescription>
              Informações completas da nota fiscal eletrônica
            </DialogDescription>
          </DialogHeader>
          {selectedNFe && (
            <div className="space-y-6">
              {/* Status and Key */}
              <div className="flex items-center justify-between">
                {renderStatusBadge(selectedNFe.status)}
                {selectedNFe.protocol && (
                  <span className="text-sm text-muted-foreground">
                    Protocolo: {selectedNFe.protocol}
                  </span>
                )}
              </div>

              {/* Access Key */}
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Chave de Acesso</p>
                <p className="font-mono text-sm break-all">{selectedNFe.accessKey}</p>
              </div>

              <Separator />

              {/* Client Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Destinatário</p>
                  <p className="font-medium">{selectedNFe.clientName}</p>
                  <p className="text-sm">{selectedNFe.clientDocument}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data de Emissão</p>
                  <p className="font-medium">{formatDate(selectedNFe.issueDate)}</p>
                  {selectedNFe.authorizationDate && (
                    <>
                      <p className="text-sm text-muted-foreground mt-2">Data de Autorização</p>
                      <p className="text-sm">{formatDate(selectedNFe.authorizationDate)}</p>
                    </>
                  )}
                </div>
              </div>

              <Separator />

              {/* Values */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Subtotal</p>
                  <p className="font-medium">{formatCurrency(selectedNFe.subtotal)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Desconto</p>
                  <p className="font-medium text-destructive">-{formatCurrency(selectedNFe.discount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Frete</p>
                  <p className="font-medium">{formatCurrency(selectedNFe.shipping)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-xl font-bold text-primary">{formatCurrency(selectedNFe.total)}</p>
                </div>
              </div>

              <Separator />

              {/* Taxes */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3">Impostos</p>
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">ICMS</p>
                    <p className="font-medium">{formatCurrency(selectedNFe.icms)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">IPI</p>
                    <p className="font-medium">{formatCurrency(selectedNFe.ipi)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">PIS</p>
                    <p className="font-medium">{formatCurrency(selectedNFe.pis)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">COFINS</p>
                    <p className="font-medium">{formatCurrency(selectedNFe.cofins)}</p>
                  </div>
                </div>
              </div>

              {/* Cancellation Info */}
              {selectedNFe.cancellationDate && (
                <>
                  <Separator />
                  <div className="rounded-lg bg-destructive/10 p-4">
                    <p className="font-medium text-destructive">Nota Cancelada</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Data: {formatDate(selectedNFe.cancellationDate)}
                    </p>
                    {selectedNFe.cancellationReason && (
                      <p className="text-sm mt-2">Motivo: {selectedNFe.cancellationReason}</p>
                    )}
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2">
                {selectedNFe.status === 'authorized' && (
                  <>
                    <Button variant="outline" onClick={() => handlePrint(selectedNFe)}>
                      <Printer className="mr-2 h-4 w-4" />
                      Imprimir DANFE
                    </Button>
                    <Button variant="outline" onClick={() => handleDownloadXML(selectedNFe)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download XML
                    </Button>
                  </>
                )}
                <Button variant="ghost" onClick={() => setDetailsOpen(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar NF-e {nfeToCancel?.number}</DialogTitle>
            <DialogDescription>
              Esta ação é irreversível. Informe o motivo do cancelamento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Motivo do cancelamento..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setCancelDialogOpen(false)}>
                Voltar
              </Button>
              <Button
                variant="destructive"
                onClick={confirmCancel}
                disabled={!cancelReason.trim()}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Confirmar Cancelamento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
