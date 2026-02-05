import { useState } from 'react';
import { ExportButton } from '@/components/shared/ExportButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Factory,
  Search,
  ClipboardCheck,
  Clock,
  PlayCircle,
  CheckCircle,
  Eye,
  Play,
  Pause,
  AlertTriangle,
  FileText,
  Calendar
} from 'lucide-react';
import { productionOrders as initialOrders, productionSummary } from '@/data/productionMockData';
import { ProductionOrder, ProductionOrderStatus, ProductionPriority } from '@/types/production';

const statusConfig: Record<ProductionOrderStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Rascunho', variant: 'secondary' },
  planned: { label: 'Planejado', variant: 'outline' },
  in_progress: { label: 'Em Produção', variant: 'default' },
  completed: { label: 'Concluído', variant: 'outline' },
  cancelled: { label: 'Cancelado', variant: 'destructive' }
};

const priorityConfig: Record<ProductionPriority, { label: string; color: string }> = {
  low: { label: 'Baixa', color: 'text-muted-foreground' },
  medium: { label: 'Média', color: 'text-blue-600' },
  high: { label: 'Alta', color: 'text-orange-600' },
  urgent: { label: 'Urgente', color: 'text-red-600' }
};

export default function ProductionOrdersPage() {
  const [orders, setOrders] = useState<ProductionOrder[]>(initialOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.productCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleViewDetails = (order: ProductionOrder) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const handleStartProduction = (order: ProductionOrder) => {
    setOrders(orders.map(o => 
      o.id === order.id 
        ? { ...o, status: 'in_progress' as ProductionOrderStatus, operator: 'Usuário Atual', startDate: format(new Date(), 'yyyy-MM-dd') }
        : o
    ));
    toast.success(`Produção iniciada: ${order.orderNumber}`);
  };

  const handlePauseProduction = (order: ProductionOrder) => {
    toast.info(`Produção pausada: ${order.orderNumber}`);
  };

  const handleCompleteProduction = (order: ProductionOrder) => {
    setOrders(orders.map(o => 
      o.id === order.id 
        ? { ...o, status: 'completed' as ProductionOrderStatus, completedDate: format(new Date(), 'yyyy-MM-dd'), producedQuantity: o.quantity }
        : o
    ));
    toast.success(`Produção concluída: ${order.orderNumber}`);
  };

  const getProgressPercentage = (order: ProductionOrder) => {
    return Math.round((order.producedQuantity / order.quantity) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ordens de Produção</h1>
          <p className="text-muted-foreground">Gerenciamento e acompanhamento da produção</p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            data={filteredOrders as unknown as Record<string, unknown>[]}
            columns={[
              { key: 'orderNumber', label: 'Nº Ordem' },
              { key: 'productName', label: 'Produto' },
              { key: 'productCode', label: 'Código' },
              { key: 'quantity', label: 'Qtd Planejada' },
              { key: 'producedQuantity', label: 'Qtd Produzida' },
              { key: 'status', label: 'Status' },
              { key: 'priority', label: 'Prioridade' },
            ]}
            filename="ordens_producao"
          />
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Nova Ordem
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planejadas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productionSummary.plannedOrders}</div>
            <p className="text-xs text-muted-foreground">Aguardando início</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Produção</CardTitle>
            <PlayCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productionSummary.inProgressOrders}</div>
            <p className="text-xs text-muted-foreground">Sendo produzidas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eficiência</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productionSummary.efficiency}%</div>
            <p className="text-xs text-muted-foreground">Taxa de produção</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregas no Prazo</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productionSummary.onTimeDelivery}%</div>
            <p className="text-xs text-muted-foreground">Cumprimento de prazos</p>
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
                placeholder="Buscar por número, produto ou código..."
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
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="planned">Planejado</SelectItem>
                <SelectItem value="in_progress">Em Produção</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Prioridades</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5" />
            Ordens de Produção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ordem</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Progresso</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.productName}</p>
                      <p className="text-sm text-muted-foreground">{order.productCode}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {order.producedQuantity}/{order.quantity} {order.unit}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={getProgressPercentage(order)} className="w-20 h-2" />
                      <span className="text-sm text-muted-foreground">{getProgressPercentage(order)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {new Date(order.dueDate) < new Date() && order.status !== 'completed' && (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                      {format(new Date(order.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`font-medium ${priorityConfig[order.priority].color}`}>
                      {priorityConfig[order.priority].label}
                    </span>
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
                      {order.status === 'planned' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartProduction(order)}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Iniciar
                        </Button>
                      )}
                      {order.status === 'in_progress' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePauseProduction(order)}
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleCompleteProduction(order)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Concluir
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
            <DialogTitle>Detalhes da Ordem - {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Produto</p>
                  <p className="font-medium">{selectedOrder.productName}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.productCode}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quantidade</p>
                  <p className="font-medium">{selectedOrder.producedQuantity} / {selectedOrder.quantity} {selectedOrder.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Centro de Trabalho</p>
                  <p className="font-medium">{selectedOrder.workCenter}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Operador</p>
                  <p className="font-medium">{selectedOrder.operator || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data Início</p>
                  <p className="font-medium">
                    {format(new Date(selectedOrder.startDate), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Prazo</p>
                  <p className="font-medium">
                    {format(new Date(selectedOrder.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">Progresso</p>
                <div className="flex items-center gap-4">
                  <Progress value={getProgressPercentage(selectedOrder)} className="flex-1 h-3" />
                  <span className="font-medium">{getProgressPercentage(selectedOrder)}%</span>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Observações</p>
                  <p className="p-3 bg-muted rounded-lg">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
