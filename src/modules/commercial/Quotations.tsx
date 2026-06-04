import { useState } from 'react';
import { toastError, toastSuccess } from '@/lib/toastHelpers';
import { Plus, Eye, MoreHorizontal, FileText, Send, CheckCircle, XCircle, ArrowRightCircle, Loader2, DollarSign, FileEdit, Mail, ThumbsUp } from 'lucide-react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { PageLoading } from '@/shared/components/PageLoading';
import { KPICard } from '@/shared/components/KPICard';
import { ExportButton } from '@/shared/components/ExportButton';
import { format, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Textarea } from '@/ui/base/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/ui/base/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/ui/base/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/ui/base/alert-dialog';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { AdvancedFilters, type FilterField } from '@/shared/components/AdvancedFilters';
import { useQuotations, useCreateQuotation, useUpdateQuotationStatus, useConvertQuotationToOrder, type DbQuotation } from '@/hooks/commercial/useQuotations';
import { ClientSelector } from '@/components/comercial/ClientSelector';
import { OrderItemsEditor, type LineItem } from '@/components/comercial/OrderItemsEditor';

import { formatBRL, formatDate } from '@/lib/formatters';
const filterFields: FilterField[] = [
  { key: 'status', label: 'Status', type: 'select', options: [
    { value: 'draft', label: 'Rascunho' }, { value: 'sent', label: 'Enviado' },
    { value: 'approved', label: 'Aprovado' }, { value: 'rejected', label: 'Rejeitado' },
    { value: 'expired', label: 'Expirado' }, { value: 'converted', label: 'Convertido' },
  ]},
  { key: 'startDate', label: 'Data Inicial', type: 'date' },
  { key: 'endDate', label: 'Data Final', type: 'date' },
];

export default function QuotationsPage() {
  const { data: quotations = [], isLoading } = useQuotations();
  const createQuotation = useCreateQuotation();
  const updateStatus = useUpdateQuotationStatus();
  const convertToOrder = useConvertQuotationToOrder();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<DbQuotation | null>(null);

  // Form state
  const [formClient, setFormClient] = useState<{ id: string | null; name: string }>({ id: null, name: '' });
  const [formItems, setFormItems] = useState<LineItem[]>([]);
  const [formValidUntil, setFormValidUntil] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const resetForm = () => {
    setFormClient({ id: null, name: '' });
    setFormItems([]);
    setFormValidUntil('');
    setFormNotes('');
  };

  const handleCreate = () => {
    if (!formClient.name || formItems.length === 0 || !formValidUntil) {
      toastError('Preencha o cliente, validade e adicione pelo menos um item');
      return;
    }
    createQuotation.mutate({
      client_id: formClient.id,
      client_name: formClient.name,
      valid_until: formValidUntil,
      notes: formNotes || null,
      items: formItems,
    }, {
      onSuccess: () => { setIsFormOpen(false); resetForm(); },
    });
  };

  const filteredQuotations = quotations.filter((q) => {
    if (filters.status && q.status !== filters.status) return false;
    if (filters.startDate) {
      const qDate = new Date(q.date);
      const startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      if (qDate < startDate) return false;
    }
    if (filters.endDate) {
      const qDate = new Date(q.date);
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      if (qDate > endDate) return false;
    }
    return true;
  });

  const columns: Column<DbQuotation>[] = [
    { key: 'number', label: 'Número', sortable: true },
    { key: 'client_name', label: 'Cliente', sortable: true },
    { key: 'date', label: 'Data', sortable: true, render: (v) => v ? format(new Date(v as string), 'dd/MM/yyyy', { locale: ptBR }) : '—' },
    { key: 'valid_until', label: 'Validade', render: (v) => {
      const date = new Date(v as string);
      return <span className={isPast(date) ? 'text-destructive' : ''}>{format(date, 'dd/MM/yyyy', { locale: ptBR })}</span>;
    }},
    { key: 'items', label: 'Itens', render: (_, row) => row.items?.length || 0 },
    { key: 'total', label: 'Total', sortable: true, render: (v) => formatBRL(v as number) },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge type="quotation" status={v as string} /> },
  ];

  const handleStatusChange = (quotation: DbQuotation, newStatus: string, message: string) => {
    updateStatus.mutate({ id: quotation.id, status: newStatus }, {
      onSuccess: () => toastSuccess(message, `Orçamento ${quotation.number}`),
    });
  };

  const handleConvert = () => {
    if (!selectedQuotation) return;
    convertToOrder.mutate(selectedQuotation, {
      onSuccess: () => { setIsConvertOpen(false); setSelectedQuotation(null); },
    });
  };

  const renderActions = (quotation: DbQuotation) => {
    const canSend = quotation.status === 'draft';
    const canApprove = quotation.status === 'sent';
    const canConvert = quotation.status === 'approved';
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => { setSelectedQuotation(quotation); setIsViewOpen(true); }}>
            <Eye className="mr-2 h-4 w-4" />Visualizar
          </DropdownMenuItem>
          <DropdownMenuItem><FileText className="mr-2 h-4 w-4" />Imprimir</DropdownMenuItem>
          {canSend && (<><DropdownMenuSeparator /><DropdownMenuItem onClick={() => handleStatusChange(quotation, 'sent', 'Orçamento enviado')}><Send className="mr-2 h-4 w-4" />Enviar ao Cliente</DropdownMenuItem></>)}
          {canApprove && (<><DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleStatusChange(quotation, 'approved', 'Orçamento aprovado')}><CheckCircle className="mr-2 h-4 w-4" />Aprovar</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange(quotation, 'rejected', 'Orçamento rejeitado')} className="text-destructive"><XCircle className="mr-2 h-4 w-4" />Rejeitar</DropdownMenuItem>
          </>)}
          {canConvert && (<><DropdownMenuSeparator /><DropdownMenuItem onClick={() => { setSelectedQuotation(quotation); setIsConvertOpen(true); }}><ArrowRightCircle className="mr-2 h-4 w-4" />Converter em Pedido</DropdownMenuItem></>)}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const draftCount = filteredQuotations.filter(q => q.status === 'draft').length;
  const sentCount = filteredQuotations.filter(q => q.status === 'sent').length;
  const approvedCount = filteredQuotations.filter(q => q.status === 'approved').length;
  const totalValue = filteredQuotations.filter(q => !['rejected', 'expired'].includes(q.status)).reduce((acc, q) => acc + q.total, 0);

  if (isLoading) {
    return <PageLoading message="Carregando orçamentos..." />;
  }

  const fmt = (v: number) => formatBRL(v);

  return (
    <PageContainer>
      <PageHeader title="Orçamentos" description="Gerencie propostas comerciais">
          <ExportButton
            data={filteredQuotations as unknown as Record<string, unknown>[]}
            columns={[
              { key: 'number', label: 'Número' }, { key: 'client_name', label: 'Cliente' },
              { key: 'date', label: 'Data', format: (v) => formatDate(v as string) },
              { key: 'valid_until', label: 'Validade', format: (v) => formatDate(v as string) },
              { key: 'total', label: 'Total', format: (v) => formatBRL(Number(v)) },
              { key: 'status', label: 'Status' },
            ]}
            filename="orcamentos"
          />
          <Button className="gap-2" onClick={() => { resetForm(); setIsFormOpen(true); }}>
            <Plus className="h-4 w-4" />Novo Orçamento
          </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Valor Total" value={formatBRL(totalValue)} icon={<DollarSign className="h-5 w-5" />} accentColor="primary" index={0} />
        <KPICard title="Rascunhos" value={draftCount} icon={<FileEdit className="h-5 w-5" />} accentColor="warning" index={1} />
        <KPICard title="Enviados" value={sentCount} icon={<Mail className="h-5 w-5" />} accentColor="info" index={2} />
        <KPICard title="Aprovados" value={approvedCount} icon={<ThumbsUp className="h-5 w-5" />} accentColor="success" index={3} />
      </div>

      <AdvancedFilters fields={filterFields} values={filters} onChange={setFilters} onClear={() => setFilters({})} />
      <DataTable columns={columns} data={filteredQuotations} searchPlaceholder="Buscar por número, cliente..." pageSize={10} actions={renderActions} />

      {/* Create Quotation Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Orçamento</DialogTitle>
            <DialogDescription>Crie uma proposta comercial para o cliente</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <ClientSelector clientId={formClient.id} clientName={formClient.name} onSelect={setFormClient} />

            <div className="space-y-2">
              <Label>Validade do Orçamento</Label>
              <Input type="date" value={formValidUntil} onChange={(e) => setFormValidUntil(e.target.value)} />
            </div>

            <OrderItemsEditor items={formItems} onChange={setFormItems} />

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Observações sobre o orçamento..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createQuotation.isPending}>
              {createQuotation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Orçamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Detalhes do Orçamento</DialogTitle></DialogHeader>
          {selectedQuotation && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-lg font-semibold">{selectedQuotation.number}</p>
                  <p className="text-sm text-muted-foreground">{format(new Date(selectedQuotation.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                </div>
                <StatusBadge type="quotation" status={selectedQuotation.status} />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Cliente</span><p className="font-medium">{selectedQuotation.client_name}</p></div>
                <div><span className="text-muted-foreground">Vendedor</span><p className="font-medium">{selectedQuotation.sales_rep_name || '-'}</p></div>
                <div><span className="text-muted-foreground">Validade</span>
                  <p className={`font-medium ${isPast(new Date(selectedQuotation.valid_until)) ? 'text-destructive' : ''}`}>
                    {format(new Date(selectedQuotation.valid_until), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
              </div>
              {selectedQuotation.items && selectedQuotation.items.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="mb-3 font-medium">Itens do Orçamento</h4>
                  <div className="rounded-md border">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b bg-muted/50"><th className="p-2 text-left">Produto</th><th className="p-2 text-right">Qtd</th><th className="p-2 text-right">Preço Unit.</th><th className="p-2 text-right">Total</th></tr></thead>
                      <tbody>
                        {selectedQuotation.items.map((item) => (
                          <tr key={item.id} className="border-b last:border-0">
                            <td className="p-2"><p className="font-medium">{item.product_name}</p><p className="text-xs text-muted-foreground">{item.product_code}</p></td>
                            <td className="p-2 text-right">{item.quantity}</td>
                            <td className="p-2 text-right">{formatBRL(item.unit_price)}</td>
                            <td className="p-2 text-right">{formatBRL(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <div className="flex justify-end border-t pt-4">
                <div className="w-64 space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatBRL(selectedQuotation.subtotal)}</span></div>
                  {selectedQuotation.discount > 0 && <div className="flex justify-between text-destructive"><span>Desconto</span><span>-{formatBRL(selectedQuotation.discount)}</span></div>}
                  <div className="flex justify-between border-t pt-1 text-base font-semibold"><span>Total</span><span>{formatBRL(selectedQuotation.total)}</span></div>
                </div>
              </div>
              {selectedQuotation.notes && <div className="border-t pt-4"><span className="text-sm text-muted-foreground">Observações</span><p className="text-sm">{selectedQuotation.notes}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
            <AlertDialogAction onClick={handleConvert} disabled={convertToOrder.isPending}>
              {convertToOrder.isPending ? 'Convertendo...' : 'Converter em Pedido'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
