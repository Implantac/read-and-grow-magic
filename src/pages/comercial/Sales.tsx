import { useState } from 'react';
import { Eye, MoreHorizontal, FileText } from 'lucide-react';
import { format } from 'date-fns';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { AdvancedFilters, type FilterField } from '@/components/shared/AdvancedFilters';
import { mockSales, getPaymentMethodLabel } from '@/data/commercialMockData';
import type { Sale } from '@/types/commercial';

const filterFields: FilterField[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'completed', label: 'Concluída' },
      { value: 'cancelled', label: 'Cancelada' },
      { value: 'refunded', label: 'Devolvida' },
    ],
  },
  {
    key: 'paymentMethod',
    label: 'Forma de Pagamento',
    type: 'select',
    options: [
      { value: 'cash', label: 'Dinheiro' },
      { value: 'credit_card', label: 'Cartão de Crédito' },
      { value: 'debit_card', label: 'Cartão de Débito' },
      { value: 'pix', label: 'PIX' },
      { value: 'boleto', label: 'Boleto' },
      { value: 'transfer', label: 'Transferência' },
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

export default function SalesPage() {
  const [sales] = useState<Sale[]>(mockSales);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Filter sales
  const filteredSales = sales.filter((sale) => {
    if (filters.status && sale.status !== filters.status) return false;
    if (filters.paymentMethod && sale.paymentMethod !== filters.paymentMethod) return false;
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      const saleDate = new Date(sale.date);
      if (saleDate < startDate) return false;
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      const saleDate = new Date(sale.date);
      if (saleDate > endDate) return false;
    }
    return true;
  });

  const columns: Column<Sale>[] = [
    { key: 'number', label: 'Número', sortable: true },
    { key: 'clientName', label: 'Cliente', sortable: true },
    {
      key: 'date',
      label: 'Data',
      sortable: true,
      render: (value) => format(new Date(value as string), "dd/MM/yyyy HH:mm", { locale: ptBR }),
    },
    {
      key: 'items',
      label: 'Itens',
      render: (_, row) => row.items.length,
    },
    {
      key: 'paymentMethod',
      label: 'Pagamento',
      render: (value) => getPaymentMethodLabel(value as Sale['paymentMethod']),
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
      render: (value) => <StatusBadge type="sale" status={value as string} />,
    },
  ];

  const handleView = (sale: Sale) => {
    setSelectedSale(sale);
    setIsViewOpen(true);
  };

  const renderActions = (sale: Sale) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleView(sale)}>
          <Eye className="mr-2 h-4 w-4" />
          Visualizar
        </DropdownMenuItem>
        <DropdownMenuItem>
          <FileText className="mr-2 h-4 w-4" />
          Imprimir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Calculate totals
  const totalSales = filteredSales.reduce((acc, sale) => {
    if (sale.status === 'completed') return acc + sale.total;
    return acc;
  }, 0);

  const salesCount = filteredSales.filter((s) => s.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Vendas</h1>
        <p className="text-muted-foreground">Histórico de vendas realizadas</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total de Vendas</p>
          <p className="text-2xl font-bold text-foreground">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSales)}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Vendas Concluídas</p>
          <p className="text-2xl font-bold text-foreground">{salesCount}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Ticket Médio</p>
          <p className="text-2xl font-bold text-foreground">
            {salesCount > 0
              ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  totalSales / salesCount
                )
              : 'R$ 0,00'}
          </p>
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
        data={filteredSales}
        searchPlaceholder="Buscar por número, cliente..."
        pageSize={10}
        actions={renderActions}
      />

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Venda</DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-lg font-semibold">{selectedSale.number}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedSale.date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
                <StatusBadge type="sale" status={selectedSale.status} />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Cliente</span>
                  <p className="font-medium">{selectedSale.clientName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Vendedor</span>
                  <p className="font-medium">{selectedSale.salesRepName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Forma de Pagamento</span>
                  <p className="font-medium">{getPaymentMethodLabel(selectedSale.paymentMethod)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="mb-3 font-medium">Itens</h4>
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
                      {selectedSale.items.map((item) => (
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
                      }).format(selectedSale.subtotal)}
                    </span>
                  </div>
                  {selectedSale.discount > 0 && (
                    <div className="flex justify-between text-destructive">
                      <span>Desconto</span>
                      <span>
                        -
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(selectedSale.discount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-1 text-base font-semibold">
                    <span>Total</span>
                    <span>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(selectedSale.total)}
                    </span>
                  </div>
                </div>
              </div>

              {selectedSale.notes && (
                <div className="border-t pt-4">
                  <span className="text-sm text-muted-foreground">Observações</span>
                  <p className="text-sm">{selectedSale.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
