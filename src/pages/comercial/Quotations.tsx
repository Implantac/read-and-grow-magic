import { useState } from 'react';
import { Plus, Eye, MoreHorizontal, FileText, Send, CheckCircle, XCircle, ArrowRightCircle } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { AdvancedFilters, type FilterField } from '@/components/shared/AdvancedFilters';
import { mockQuotations, getQuotationStatusLabel } from '@/data/commercialMockData';
import type { Quotation, QuotationStatus } from '@/types/commercial';

const filterFields: FilterField[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'draft', label: 'Rascunho' },
      { value: 'sent', label: 'Enviado' },
      { value: 'approved', label: 'Aprovado' },
      { value: 'rejected', label: 'Rejeitado' },
      { value: 'expired', label: 'Expirado' },
      { value: 'converted', label: 'Convertido' },
    ],
  },
  {
    key: 'startDate',
    label: 'Data Inicial',
    type: 'date',
  },
  {
    key: 'endDate',
    label: 'Data Final',
    type: 'date',
  },
];

export default function QuotationsPage() {
  const { toast } = useToast();
  const [quotations, setQuotations] = useState<Quotation[]>(mockQuotations);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  // Filter quotations
  const filteredQuotations = quotations.filter((quotation) => {
    if (filters.status && quotation.status !== filters.status) return false;
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      const quotationDate = new Date(quotation.date);
      if (quotationDate < startDate) return false;
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      const quotationDate = new Date(quotation.date);
      if (quotationDate > endDate) return false;
    }
    return true;
  });

  const columns: Column<Quotation>[] = [
    { key: 'number', label: 'Número', sortable: true },
    { key: 'clientName', label: 'Cliente', sortable: true },
    {
      key: 'date',
      label: 'Data',
      sortable: true,
      render: (value) => format(new Date(value as string), 'dd/MM/yyyy', { locale: ptBR }),
    },
    {
      key: 'validUntil',
      label: 'Validade',
      render: (value) => {
        const date = new Date(value as string);
        const isExpired = isPast(date);
        return (
          <span className={isExpired ? 'text-destructive' : ''}>
            {format(date, 'dd/MM/yyyy', { locale: ptBR })}
          </span>
        );
      },
    },
    {
      key: 'items',
      label: 'Itens',
      render: (_, row) => row.items.length,
    },
    {
      key: 'total',
      label: 'Total',
      sortable: true,
      render: (value) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value as number),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge type="quotation" status={value as string} />,
    },
  ];

  const handleView = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setIsViewOpen(true);
  };

  const handleSend = (quotation: Quotation) => {
    setQuotations((prev) =>
      prev.map((q) =>
        q.id === quotation.id
          ? { ...q, status: 'sent' as QuotationStatus, updatedAt: new Date().toISOString() }
          : q
      )
    );
    toast({
      title: 'Orçamento enviado',
      description: `Orçamento ${quotation.number} foi enviado ao cliente`,
    });
  };

  const handleApprove = (quotation: Quotation) => {
    setQuotations((prev) =>
      prev.map((q) =>
        q.id === quotation.id
          ? { ...q, status: 'approved' as QuotationStatus, updatedAt: new Date().toISOString() }
          : q
      )
    );
    toast({
      title: 'Orçamento aprovado',
      description: `Orçamento ${quotation.number} foi aprovado`,
    });
  };

  const handleReject = (quotation: Quotation) => {
    setQuotations((prev) =>
      prev.map((q) =>
        q.id === quotation.id
          ? { ...q, status: 'rejected' as QuotationStatus, updatedAt: new Date().toISOString() }
          : q
      )
    );
    toast({
      title: 'Orçamento rejeitado',
      description: `Orçamento ${quotation.number} foi rejeitado`,
    });
  };

  const handleConvert = () => {
    if (!selectedQuotation) return;

    setQuotations((prev) =>
      prev.map((q) =>
        q.id === selectedQuotation.id
          ? { ...q, status: 'converted' as QuotationStatus, updatedAt: new Date().toISOString() }
          : q
      )
    );
    toast({
      title: 'Orçamento convertido',
      description: `Orçamento ${selectedQuotation.number} foi convertido em pedido`,
    });
    setIsConvertOpen(false);
    setSelectedQuotation(null);
  };

  const renderActions = (quotation: Quotation) => {
    const canSend = quotation.status === 'draft';
    const canApprove = quotation.status === 'sent';
    const canConvert = quotation.status === 'approved';

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleView(quotation)}>
            <Eye className="mr-2 h-4 w-4" />
            Visualizar
          </DropdownMenuItem>
          <DropdownMenuItem>
            <FileText className="mr-2 h-4 w-4" />
            Imprimir
          </DropdownMenuItem>
          {canSend && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleSend(quotation)}>
                <Send className="mr-2 h-4 w-4" />
                Enviar ao Cliente
              </DropdownMenuItem>
            </>
          )}
          {canApprove && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleApprove(quotation)}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Aprovar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleReject(quotation)} className="text-destructive">
                <XCircle className="mr-2 h-4 w-4" />
                Rejeitar
              </DropdownMenuItem>
            </>
          )}
          {canConvert && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedQuotation(quotation);
                  setIsConvertOpen(true);
                }}
              >
                <ArrowRightCircle className="mr-2 h-4 w-4" />
                Converter em Pedido
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // Calculate summary
  const draftCount = filteredQuotations.filter((q) => q.status === 'draft').length;
  const sentCount = filteredQuotations.filter((q) => q.status === 'sent').length;
  const approvedCount = filteredQuotations.filter((q) => q.status === 'approved').length;
  const totalValue = filteredQuotations
    .filter((q) => !['rejected', 'expired'].includes(q.status))
    .reduce((acc, q) => acc + q.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Orçamentos</h1>
          <p className="text-muted-foreground">Gerencie propostas comerciais</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Orçamento
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Valor Total</p>
          <p className="text-2xl font-bold text-foreground">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
          </p>
        </div>
        <div className="rounded-lg border bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">Rascunhos</p>
          <p className="text-2xl font-bold text-foreground">{draftCount}</p>
        </div>
        <div className="rounded-lg border bg-info/10 p-4">
          <p className="text-sm text-info">Enviados</p>
          <p className="text-2xl font-bold text-info">{sentCount}</p>
        </div>
        <div className="rounded-lg border bg-success/10 p-4">
          <p className="text-sm text-success">Aprovados</p>
          <p className="text-2xl font-bold text-success">{approvedCount}</p>
        </div>
      </div>

      <AdvancedFilters
        fields={filterFields}
        values={filters}
        onChange={setFilters}
        onClear={() => setFilters({})}
      />

      <DataTable
        columns={columns}
        data={filteredQuotations}
        searchPlaceholder="Buscar por número, cliente..."
        pageSize={10}
        actions={renderActions}
      />

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Orçamento</DialogTitle>
          </DialogHeader>
          {selectedQuotation && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-lg font-semibold">{selectedQuotation.number}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedQuotation.date), "dd 'de' MMMM 'de' yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
                <StatusBadge type="quotation" status={selectedQuotation.status} />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Cliente</span>
                  <p className="font-medium">{selectedQuotation.clientName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Vendedor</span>
                  <p className="font-medium">{selectedQuotation.salesRepName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Validade</span>
                  <p className={`font-medium ${isPast(new Date(selectedQuotation.validUntil)) ? 'text-destructive' : ''}`}>
                    {format(new Date(selectedQuotation.validUntil), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="mb-3 font-medium">Itens do Orçamento</h4>
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-2 text-left">Produto</th>
                        <th className="p-2 text-right">Qtd</th>
                        <th className="p-2 text-right">Preço Unit.</th>
                        <th className="p-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedQuotation.items.map((item) => (
                        <tr key={item.id} className="border-b last:border-0">
                          <td className="p-2">
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-xs text-muted-foreground">{item.productCode}</p>
                          </td>
                          <td className="p-2 text-right">{item.quantity}</td>
                          <td className="p-2 text-right">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(item.unitPrice)}
                          </td>
                          <td className="p-2 text-right">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end border-t pt-4">
                <div className="w-64 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(selectedQuotation.subtotal)}
                    </span>
                  </div>
                  {selectedQuotation.discount > 0 && (
                    <div className="flex justify-between text-destructive">
                      <span>Desconto</span>
                      <span>
                        -
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(selectedQuotation.discount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-1 text-base font-semibold">
                    <span>Total</span>
                    <span>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(selectedQuotation.total)}
                    </span>
                  </div>
                </div>
              </div>

              {selectedQuotation.notes && (
                <div className="border-t pt-4">
                  <span className="text-sm text-muted-foreground">Observações</span>
                  <p className="text-sm">{selectedQuotation.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Convert Confirmation */}
      <AlertDialog open={isConvertOpen} onOpenChange={setIsConvertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Converter em Pedido</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja converter o orçamento "{selectedQuotation?.number}" em um pedido de venda?
              Um novo pedido será criado com os mesmos itens e valores.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConvert}>
              Converter em Pedido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
