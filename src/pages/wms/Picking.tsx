import { useState } from 'react';
import { ExportButton } from '@/components/shared/ExportButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Search,
  Package,
  User,
  Clock,
  CheckCircle,
  PlayCircle,
  Eye,
  ClipboardList,
  MapPin
} from 'lucide-react';
import { pickingOrders as initialOrders } from '@/data/wmsMockData';
import { PickingOrder, PickingStatus, PickingItem } from '@/types/wms';

const statusConfig: Record<PickingStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  assigned: { label: 'Atribuído', variant: 'default' },
  in_progress: { label: 'Em Andamento', variant: 'default' },
  completed: { label: 'Concluído', variant: 'outline' },
  cancelled: { label: 'Cancelado', variant: 'destructive' }
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Baixa', color: 'bg-slate-500' },
  medium: { label: 'Média', color: 'bg-blue-500' },
  high: { label: 'Alta', color: 'bg-amber-500' },
  urgent: { label: 'Urgente', color: 'bg-red-500' }
};

export default function PickingPage() {
  const [orders, setOrders] = useState<PickingOrder[]>(initialOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<PickingOrder | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [pickingOpen, setPickingOpen] = useState(false);
  const [pickingItems, setPickingItems] = useState<PickingItem[]>([]);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const inProgressCount = orders.filter(o => o.status === 'in_progress' || o.status === 'assigned').length;
  const completedToday = orders.filter(o => 
    o.status === 'completed' && 
    o.completedAt?.startsWith(format(new Date(), 'yyyy-MM-dd'))
  ).length;
  const urgentCount = orders.filter(o => o.priority === 'urgent' && o.status !== 'completed').length;

  const handleViewDetails = (order: PickingOrder) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const handleStartPicking = (order: PickingOrder) => {
    setSelectedOrder(order);
    setPickingItems([...order.items]);
    setPickingOpen(true);
  };

  const handleAssignToMe = (orderId: string) => {
    setOrders(orders.map(o => 
      o.id === orderId 
        ? { ...o, status: 'assigned' as PickingStatus, assignedTo: 'Usuário Atual' }
        : o
    ));
    toast.success('Ordem atribuída a você!');
  };

  const handleToggleItem = (itemId: string) => {
    setPickingItems(items => 
      items.map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              picked: !item.picked,
              pickedQty: !item.picked ? item.requestedQty : 0 
            }
          : item
      )
    );
  };

  const handleConfirmPicking = () => {
    if (!selectedOrder) return;

    const allPicked = pickingItems.every(item => item.picked);
    
    setOrders(orders.map(o => 
      o.id === selectedOrder.id 
        ? { 
            ...o, 
            items: pickingItems,
            status: allPicked ? 'completed' : 'in_progress',
            startedAt: o.startedAt || new Date().toISOString(),
            completedAt: allPicked ? new Date().toISOString() : undefined
          }
        : o
    ));

    toast.success(allPicked ? 'Picking concluído!' : 'Progresso salvo');
    setPickingOpen(false);
    setSelectedOrder(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Picking</h1>
          <p className="text-muted-foreground">Separação de pedidos para expedição</p>
        </div>
        <ExportButton
          data={filteredOrders as unknown as Record<string, unknown>[]}
          columns={[
            { key: 'orderNumber', label: 'Nº Ordem' },
            { key: 'customerName', label: 'Cliente' },
            { key: 'priority', label: 'Prioridade' },
            { key: 'status', label: 'Status' },
            { key: 'assignedTo', label: 'Operador' },
          ]}
          filename="picking_wms"
        />
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
            <p className="text-xs text-muted-foreground">Aguardando separação</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <PlayCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressCount}</div>
            <p className="text-xs text-muted-foreground">Sendo separados</p>
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
        <Card className={urgentCount > 0 ? 'border-red-500' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
            <Package className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{urgentCount}</div>
            <p className="text-xs text-muted-foreground">Prioridade máxima</p>
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
                placeholder="Buscar por número ou cliente..."
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
                <SelectItem value="assigned">Atribuído</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Ordens de Picking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Atribuído</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const priority = priorityConfig[order.priority];
                const pickedItems = order.items.filter(i => i.picked).length;
                
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>
                      <Badge className={`${priority.color} text-white`}>
                        {priority.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {pickedItems}/{order.items.length}
                    </TableCell>
                    <TableCell>
                      {order.assignedTo ? (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {order.assignedTo}
                        </div>
                      ) : '-'}
                    </TableCell>
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
                        {order.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAssignToMe(order.id)}
                          >
                            <User className="h-4 w-4 mr-1" />
                            Atribuir
                          </Button>
                        )}
                        {(order.status === 'assigned' || order.status === 'in_progress') && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleStartPicking(order)}
                          >
                            <Package className="h-4 w-4 mr-1" />
                            Separar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
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
            <DialogTitle>Detalhes do Picking - {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pedido de Venda</p>
                  <p className="font-medium">{selectedOrder.salesOrderId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Prioridade</p>
                  <Badge className={`${priorityConfig[selectedOrder.priority].color} text-white`}>
                    {priorityConfig[selectedOrder.priority].label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Atribuído a</p>
                  <p className="font-medium">{selectedOrder.assignedTo || '-'}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Itens para Separação</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Endereço</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-sm text-muted-foreground">{item.productCode}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {item.location}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{item.requestedQty} {item.unit}</TableCell>
                        <TableCell>
                          {item.picked ? (
                            <Badge variant="outline" className="text-green-500">Separado</Badge>
                          ) : (
                            <Badge variant="secondary">Pendente</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Picking Dialog */}
      <Dialog open={pickingOpen} onOpenChange={setPickingOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Separação - {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Cliente:</strong> {selectedOrder.customerName}
                </p>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pickingItems.map((item) => (
                    <TableRow key={item.id} className={item.picked ? 'bg-green-50 dark:bg-green-950' : ''}>
                      <TableCell>
                        <Checkbox 
                          checked={item.picked}
                          onCheckedChange={() => handleToggleItem(item.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className={`font-medium ${item.picked ? 'line-through text-muted-foreground' : ''}`}>
                            {item.productName}
                          </p>
                          <p className="text-sm text-muted-foreground">{item.productCode}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {item.location}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.requestedQty} {item.unit}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span>Progresso</span>
                <span className="font-medium">
                  {pickingItems.filter(i => i.picked).length} / {pickingItems.length} itens
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPickingOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmPicking}>
              Confirmar Separação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
