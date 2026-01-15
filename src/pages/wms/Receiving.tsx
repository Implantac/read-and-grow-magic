import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Package,
  Search,
  Truck,
  CheckCircle,
  Clock,
  PlayCircle,
  Eye,
  ClipboardCheck,
  AlertCircle
} from 'lucide-react';
import { receivingOrders as initialOrders } from '@/data/wmsMockData';
import { ReceivingOrder, ReceivingStatus } from '@/types/wms';

const statusConfig: Record<ReceivingStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  in_progress: { label: 'Em Andamento', variant: 'default' },
  completed: { label: 'Concluído', variant: 'outline' },
  cancelled: { label: 'Cancelado', variant: 'destructive' }
};

export default function ReceivingPage() {
  const [orders, setOrders] = useState<ReceivingOrder[]>(initialOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<ReceivingOrder | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [receivingItems, setReceivingItems] = useState<{ id: string; qty: number }[]>([]);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const inProgressCount = orders.filter(o => o.status === 'in_progress').length;
  const completedToday = orders.filter(o => 
    o.status === 'completed' && 
    o.receivedDate === format(new Date(), 'yyyy-MM-dd')
  ).length;

  const handleViewDetails = (order: ReceivingOrder) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const handleStartReceiving = (order: ReceivingOrder) => {
    setSelectedOrder(order);
    setReceivingItems(order.items.map(item => ({ id: item.id, qty: item.receivedQty })));
    setReceiveOpen(true);
  };

  const handleConfirmReceiving = () => {
    if (!selectedOrder) return;

    const updatedItems = selectedOrder.items.map(item => {
      const receiving = receivingItems.find(r => r.id === item.id);
      return { ...item, receivedQty: receiving?.qty || item.receivedQty };
    });

    const allReceived = updatedItems.every(item => item.receivedQty >= item.expectedQty);
    
    setOrders(orders.map(o => 
      o.id === selectedOrder.id 
        ? { 
            ...o, 
            items: updatedItems,
            status: allReceived ? 'completed' : 'in_progress',
            receivedDate: allReceived ? format(new Date(), 'yyyy-MM-dd') : undefined,
            operator: 'Usuário Atual'
          }
        : o
    ));

    toast.success(allReceived ? 'Recebimento concluído!' : 'Recebimento parcial registrado');
    setReceiveOpen(false);
    setSelectedOrder(null);
  };

  const updateReceivingQty = (itemId: string, qty: number) => {
    setReceivingItems(items => 
      items.map(item => item.id === itemId ? { ...item, qty } : item)
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recebimento</h1>
          <p className="text-muted-foreground">Gerenciamento de recebimento de mercadorias</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Aguardando recebimento</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <PlayCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressCount}</div>
            <p className="text-xs text-muted-foreground">Sendo recebidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídos Hoje</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedToday}</div>
            <p className="text-xs text-muted-foreground">Finalizados hoje</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ordens</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">Ordens cadastradas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por número ou fornecedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Ordens de Recebimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Data Prevista</TableHead>
                <TableHead>Doca</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>{order.supplier}</TableCell>
                  <TableCell>
                    {format(new Date(order.expectedDate), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell>{order.dock}</TableCell>
                  <TableCell>{order.items.length} item(s)</TableCell>
                  <TableCell>
                    <Badge variant={statusConfig[order.status].variant}>
                      {statusConfig[order.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(order)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {(order.status === 'pending' || order.status === 'in_progress') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartReceiving(order)}
                        >
                          <ClipboardCheck className="h-4 w-4 mr-1" />
                          Receber
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma ordem encontrada
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
            <DialogTitle>Detalhes do Recebimento - {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Fornecedor</p>
                  <p className="font-medium">{selectedOrder.supplier}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data Prevista</p>
                  <p className="font-medium">
                    {format(new Date(selectedOrder.expectedDate), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Doca</p>
                  <p className="font-medium">{selectedOrder.dock}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Operador</p>
                  <p className="font-medium">{selectedOrder.operator || '-'}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Itens</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Esperado</TableHead>
                      <TableHead className="text-right">Recebido</TableHead>
                      <TableHead>Lote</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.productCode}</TableCell>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell className="text-right">{item.expectedQty} {item.unit}</TableCell>
                        <TableCell className="text-right">
                          <span className={item.receivedQty < item.expectedQty ? 'text-destructive' : ''}>
                            {item.receivedQty} {item.unit}
                          </span>
                        </TableCell>
                        <TableCell>{item.batch || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receiving Dialog */}
      <Dialog open={receiveOpen} onOpenChange={setReceiveOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Receber Mercadorias - {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <AlertCircle className="h-4 w-4 text-primary" />
                <span className="text-sm">Informe as quantidades recebidas para cada item</span>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Esperado</TableHead>
                    <TableHead className="text-right">Recebido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedOrder.items.map((item) => {
                    const receiving = receivingItems.find(r => r.id === item.id);
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-sm text-muted-foreground">{item.productCode}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{item.expectedQty} {item.unit}</TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min={0}
                            max={item.expectedQty}
                            value={receiving?.qty || 0}
                            onChange={(e) => updateReceivingQty(item.id, parseInt(e.target.value) || 0)}
                            className="w-24 ml-auto"
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
            <Button variant="outline" onClick={() => setReceiveOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmReceiving}>
              Confirmar Recebimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
