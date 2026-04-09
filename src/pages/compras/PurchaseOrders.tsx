import { useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Plus, Search, MoreHorizontal, Eye, Edit, Trash2, Send, CheckCircle, Package, FileText } from 'lucide-react';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { purchaseOrderStatuses } from '@/config/purchasing';
import { PurchaseOrder, PurchaseOrderStatus } from '@/types/purchasing';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const priorityConfig = {
  low: { label: 'Baixa', className: 'bg-muted text-muted-foreground' },
  medium: { label: 'Média', className: 'bg-info/10 text-info' },
  high: { label: 'Alta', className: 'bg-warning/10 text-warning' },
  urgent: { label: 'Urgente', className: 'bg-destructive/10 text-destructive' },
};

export default function PurchaseOrdersPage() {
  const { orders, loading, refetch, update: updateOrder, remove: removeOrder } = usePurchaseOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [receiveQuantities, setReceiveQuantities] = useState<Record<string, number>>({});

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const summaryData = {
    total: orders.reduce((sum, o) => sum + o.total, 0),
    pending: orders.filter((o) => ['draft', 'pending_approval', 'approved'].includes(o.status)).length,
    inTransit: orders.filter((o) => ['sent', 'confirmed'].includes(o.status)).length,
    received: orders.filter((o) => o.status === 'received').length,
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
  };

  const handleView = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setIsViewOpen(true);
  };

  const handleReceive = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    const quantities: Record<string, number> = {};
    order.items.forEach((item) => {
      quantities[item.id] = item.quantity - item.receivedQuantity;
    });
    setReceiveQuantities(quantities);
    setIsReceiveOpen(true);
  };

  const handleConfirmReceive = () => {
    if (!selectedOrder) return;
    // TODO: update received quantities via supabase
    setIsReceiveOpen(false);
  };

  const handleStatusChange = async (orderId: string, newStatus: PurchaseOrderStatus) => {
    await updateOrder(orderId, { status: newStatus });
    if (newStatus === 'approved' || newStatus === 'sent') {
      toast.success('🏭 Ordem de recebimento WMS gerada automaticamente!');
    }
  };

  const handleDelete = async (id: string) => {
    await removeOrder(id);
  };

  const getProgressPercentage = (order: PurchaseOrder) => {
    const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const receivedQty = order.items.reduce((sum, item) => sum + item.receivedQuantity, 0);
    return totalQty > 0 ? Math.round((receivedQty / totalQty) * 100) : 0;
  };

  return (
    <PageContainer>
      <PageHeader title="Pedidos de Compra" description="Gerencie os pedidos de compra">
        <ExportButton
          data={filteredOrders as unknown as Record<string, unknown>[]}
          columns={[
            { key: 'number', label: 'Número' },
            { key: 'supplierName', label: 'Fornecedor' },
            { key: 'date', label: 'Data', format: (v) => new Date(v as string).toLocaleDateString('pt-BR') },
            { key: 'total', label: 'Total', format: (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v)) },
            { key: 'status', label: 'Status' },
            { key: 'priority', label: 'Prioridade' },
          ]}
          filename="pedidos_compra"
        />
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Pedido
        </Button>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaryData.total)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-warning">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{summaryData.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-info">Em Trânsito</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">{summaryData.inTransit}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-success">Recebidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{summaryData.received}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número ou fornecedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(purchaseOrderStatuses).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
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
                <TableHead>Fornecedor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Entrega Prevista</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Recebimento</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const progress = getProgressPercentage(order);
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.number}</TableCell>
                    <TableCell>{order.supplierName}</TableCell>
                    <TableCell>{formatDate(order.date)}</TableCell>
                    <TableCell>{formatDate(order.expectedDelivery)}</TableCell>
                    <TableCell>{formatCurrency(order.total)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-success rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">{progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={priorityConfig[order.priority].className}>
                        {priorityConfig[order.priority].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={purchaseOrderStatuses[order.status].color}>
                        {purchaseOrderStatuses[order.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(order)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {order.status === 'draft' && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(order.id, 'pending_approval')}
                            >
                              <Send className="mr-2 h-4 w-4" />
                              Enviar para Aprovação
                            </DropdownMenuItem>
                          )}
                          {order.status === 'pending_approval' && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(order.id, 'approved')}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Aprovar
                            </DropdownMenuItem>
                          )}
                          {order.status === 'approved' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'sent')}>
                              <Send className="mr-2 h-4 w-4" />
                              Enviar ao Fornecedor
                            </DropdownMenuItem>
                          )}
                          {['confirmed', 'partial_received'].includes(order.status) && (
                            <DropdownMenuItem onClick={() => handleReceive(order)}>
                              <Package className="mr-2 h-4 w-4" />
                              Registrar Recebimento
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(order.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    Nenhum pedido encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido de Compra</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{selectedOrder.number}</h3>
                  <p className="text-muted-foreground">{selectedOrder.supplierName}</p>
                </div>
                <div className="flex gap-2">
                  <Badge className={priorityConfig[selectedOrder.priority].className}>
                    {priorityConfig[selectedOrder.priority].label}
                  </Badge>
                  <Badge className={purchaseOrderStatuses[selectedOrder.status].color}>
                    {purchaseOrderStatuses[selectedOrder.status].label}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Data do Pedido</p>
                  <p className="font-medium">{formatDate(selectedOrder.date)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Entrega Prevista</p>
                  <p className="font-medium">{formatDate(selectedOrder.expectedDelivery)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cond. Pagamento</p>
                  <p className="font-medium">{selectedOrder.paymentTerms}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Comprador</p>
                  <p className="font-medium">{selectedOrder.buyerName}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-4">Itens do Pedido</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Recebido</TableHead>
                      <TableHead className="text-right">Preço Unit.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.productCode}</TableCell>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell className="text-right">
                          {item.quantity} {item.unit}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.receivedQuantity} {item.unit}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Separator />

              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Desconto</span>
                    <span className="text-red-600">
                      -{formatCurrency(selectedOrder.discount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frete</span>
                    <span>{formatCurrency(selectedOrder.shipping)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Impostos</span>
                    <span>{formatCurrency(selectedOrder.taxes)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Observações</p>
                    <p>{selectedOrder.notes}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receive Dialog */}
      <Dialog open={isReceiveOpen} onOpenChange={setIsReceiveOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Recebimento</DialogTitle>
            <DialogDescription>
              Informe as quantidades recebidas para cada item
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Pedido</TableHead>
                    <TableHead className="text-right">Já Recebido</TableHead>
                    <TableHead className="text-right">Receber Agora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedOrder.items.map((item) => {
                    const remaining = item.quantity - item.receivedQuantity;
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.productName}</div>
                            <div className="text-sm text-muted-foreground">{item.productCode}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.quantity} {item.unit}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.receivedQuantity} {item.unit}
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            className="w-24 text-right ml-auto"
                            min={0}
                            max={remaining}
                            value={receiveQuantities[item.id] || 0}
                            onChange={(e) =>
                              setReceiveQuantities({
                                ...receiveQuantities,
                                [item.id]: Math.min(parseInt(e.target.value) || 0, remaining),
                              })
                            }
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReceiveOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmReceive}>Confirmar Recebimento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
