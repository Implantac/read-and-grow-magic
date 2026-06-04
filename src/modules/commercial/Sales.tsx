import { useState } from 'react';
import { toastError } from '@/lib/toastHelpers';
import { Plus, Eye, MoreHorizontal, FileText, Loader2, DollarSign, ShoppingBag, TrendingUp } from 'lucide-react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { PageLoading } from '@/shared/components/PageLoading';
import { KPICard } from '@/shared/components/KPICard';
import { ExportButton } from '@/shared/components/ExportButton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/ui/base/button';
import { Label } from '@/ui/base/label';
import { Textarea } from '@/ui/base/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/ui/base/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/ui/base/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { AdvancedFilters, type FilterField } from '@/shared/components/AdvancedFilters';
import { getPaymentMethodLabel } from '@/config/commercial';
import { useSales, useCreateSale } from '@/hooks/commercial/useSales';
import type { DbSale } from '@/types/commercial';

import { ClientSelector } from '@/components/comercial/ClientSelector';
import { OrderItemsEditor, type LineItem } from '@/components/comercial/OrderItemsEditor';

import { formatBRL, formatDate } from '@/lib/formatters';
const filterFields: FilterField[] = [
  { key: 'status', label: 'Status', type: 'select', options: [
    { value: 'completed', label: 'Concluída' }, { value: 'cancelled', label: 'Cancelada' }, { value: 'refunded', label: 'Devolvida' },
  ]},
  { key: 'paymentMethod', label: 'Forma de Pagamento', type: 'select', options: [
    { value: 'cash', label: 'Dinheiro' }, { value: 'credit_card', label: 'Cartão de Crédito' },
    { value: 'debit_card', label: 'Cartão de Débito' }, { value: 'pix', label: 'PIX' },
    { value: 'boleto', label: 'Boleto' }, { value: 'transfer', label: 'Transferência' },
  ]},
  { key: 'startDate', label: 'Data Inicial', type: 'date' },
  { key: 'endDate', label: 'Data Final', type: 'date' },
];

export default function SalesPage() {
  const { data: sales = [], isLoading } = useSales() as { data: DbSale[] | undefined, isLoading: boolean };
  const createSale = useCreateSale();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<DbSale | null>(null);

  // Form state
  const [formClient, setFormClient] = useState<{ id: string | null; name: string }>({ id: null, name: '' });
  const [formItems, setFormItems] = useState<LineItem[]>([]);
  const [formPayment, setFormPayment] = useState('pix');
  const [formNotes, setFormNotes] = useState('');

  const resetForm = () => {
    setFormClient({ id: null, name: '' });
    setFormItems([]);
    setFormPayment('pix');
    setFormNotes('');
  };

  const handleCreate = () => {
    if (!formClient.name || formItems.length === 0) {
      toastError('Preencha o cliente e adicione pelo menos um item');
      return;
    }
    createSale.mutate({
      client_id: formClient.id,
      client_name: formClient.name,
      payment_method: formPayment,
      notes: formNotes || null,
      items: formItems,
    }, {
      onSuccess: () => { setIsFormOpen(false); resetForm(); },
    });
  };

  const filteredSales = sales.filter((sale) => {
    if (filters.status && sale.status !== filters.status) return false;
    if (filters.paymentMethod && sale.payment_method !== filters.paymentMethod) return false;
    if (filters.startDate) {
      const saleDate = new Date(sale.date);
      const startDate = new Date(filters.startDate);
      // Set time to beginning of day for comparison
      startDate.setHours(0, 0, 0, 0);
      if (saleDate < startDate) return false;
    }
    if (filters.endDate) {
      const saleDate = new Date(sale.date);
      const endDate = new Date(filters.endDate);
      // Set time to end of day for comparison
      endDate.setHours(23, 59, 59, 999);
      if (saleDate > endDate) return false;
    }
    return true;
  });


  const columns: Column<DbSale>[] = [
    { key: 'number', label: 'Número', sortable: true },
    { key: 'client_name', label: 'Cliente', sortable: true },
    { key: 'date', label: 'Data', sortable: true, render: (v) => v ? format(new Date(v as string), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '—' },
    { key: 'items', label: 'Itens', render: (_, row) => row.items?.length || 0 },
    { key: 'payment_method', label: 'Pagamento', render: (v) => getPaymentMethodLabel(v as any) },
    { key: 'total', label: 'Total', sortable: true, render: (v) => formatBRL(v as number) },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge type="sale" status={v as string} /> },
  ];

  const renderActions = (sale: DbSale) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => { setSelectedSale(sale); setIsViewOpen(true); }}>
          <Eye className="mr-2 h-4 w-4" />Visualizar
        </DropdownMenuItem>
        <DropdownMenuItem><FileText className="mr-2 h-4 w-4" />Imprimir</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const totalSales = filteredSales.filter(s => s.status === 'completed').reduce((acc, s) => acc + s.total, 0);
  const salesCount = filteredSales.filter(s => s.status === 'completed').length;

  if (isLoading) {
    return <PageLoading message="Carregando vendas..." />;
  }

  const fmt = (v: number) => formatBRL(v);

  return (
    <PageContainer>
      <PageHeader title="Vendas" description="Histórico de vendas realizadas">
        <Button className="gap-2" onClick={() => { resetForm(); setIsFormOpen(true); }}>
          <Plus className="h-4 w-4" />Nova Venda
        </Button>
      </PageHeader>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-3">
        <KPICard title="Total de Vendas" value={formatBRL(totalSales)} icon={<DollarSign className="h-5 w-5" />} accentColor="primary" index={0} />
        <KPICard title="Vendas Concluídas" value={salesCount} icon={<ShoppingBag className="h-5 w-5" />} accentColor="success" index={1} />
        <KPICard title="Ticket Médio" value={salesCount > 0 ? formatBRL(totalSales / salesCount) : 'R$ 0,00'} icon={<TrendingUp className="h-5 w-5" />} accentColor="info" index={2} />
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <AdvancedFilters fields={filterFields} values={filters} onChange={setFilters} onClear={() => setFilters({})} />
        <ExportButton
          data={filteredSales as unknown as Record<string, unknown>[]}
          columns={[
            { key: 'number', label: 'Número' }, { key: 'client_name', label: 'Cliente' },
            { key: 'date', label: 'Data', format: (v) => formatDate(v as string) },
            { key: 'payment_method', label: 'Pagamento', format: (v) => getPaymentMethodLabel(v as any) },
            { key: 'total', label: 'Total', format: (v) => formatBRL(Number(v)) },
            { key: 'status', label: 'Status' },
          ]}
          filename="vendas"
        />
      </div>
      <DataTable columns={columns} data={filteredSales} searchPlaceholder="Buscar por número, cliente..." pageSize={10} actions={renderActions} />

      {/* Create Sale Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Venda</DialogTitle>
            <DialogDescription>Registre uma nova venda</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <ClientSelector clientId={formClient.id} clientName={formClient.name} onSelect={setFormClient} />

            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select value={formPayment} onValueChange={setFormPayment}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="transfer">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <OrderItemsEditor items={formItems} onChange={setFormItems} />

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Observações sobre a venda..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createSale.isPending}>
              {createSale.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar Venda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Detalhes da Venda</DialogTitle></DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-lg font-semibold">{selectedSale.number}</p>
                  <p className="text-sm text-muted-foreground">{format(new Date(selectedSale.date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}</p>
                </div>
                <StatusBadge type="sale" status={selectedSale.status} />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Cliente</span><p className="font-medium">{selectedSale.client_name}</p></div>
                <div><span className="text-muted-foreground">Vendedor</span><p className="font-medium">{selectedSale.sales_rep_name || '-'}</p></div>
                <div><span className="text-muted-foreground">Forma de Pagamento</span><p className="font-medium">{getPaymentMethodLabel(selectedSale.payment_method as any)}</p></div>
              </div>
              {selectedSale.items && selectedSale.items.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="mb-3 font-medium">Itens</h4>
                  <div className="rounded-md border">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b bg-muted/50"><th className="p-2 text-left">Produto</th><th className="p-2 text-right">Qtd</th><th className="p-2 text-right">Preço Unit.</th><th className="p-2 text-right">Total</th></tr></thead>
                      <tbody>
                        {selectedSale.items.map((item) => (
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
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatBRL(selectedSale.subtotal)}</span></div>
                  {selectedSale.discount > 0 && <div className="flex justify-between text-destructive"><span>Desconto</span><span>-{formatBRL(selectedSale.discount)}</span></div>}
                  <div className="flex justify-between border-t pt-1 text-base font-semibold"><span>Total</span><span>{formatBRL(selectedSale.total)}</span></div>
                </div>
              </div>
              {selectedSale.notes && <div className="border-t pt-4"><span className="text-sm text-muted-foreground">Observações</span><p className="text-sm">{selectedSale.notes}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
